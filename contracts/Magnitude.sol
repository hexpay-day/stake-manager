// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { Utils } from "./Utils.sol";
import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";

import "hardhat/console.sol";

contract Magnitude is Utils {
  uint256 constant internal MULTIPLIER = TWO;
  function _computeDayMagnitude(
    uint256 limit, uint256 method, uint256 x,
    uint256 today, // today
    uint256 lockedDay, // lockedDay
    uint256 stakedDays
  ) internal pure returns(uint256 amount) {
    unchecked {
      if (method < THREE) {
        if (method == ONE) {
          // useful when you want the next stake start to be
          // entirely different and simply repeat after that
          amount = x; // 1
        } else {
          amount = stakedDays; // 2 - repeat number of days
        }
      } else {
        // 3 - start an equally spaced ladder, even if end stake happens late
        uint256 daysAfterLock = today - lockedDay;
        if (daysAfterLock == stakedDays) {
          amount = stakedDays; // ended on first available day (most cases)
        } else {
          // did not end on first available day
          if (daysAfterLock >= stakedDays) {
            // presumptive value extrapolated backward
            lockedDay = today - (daysAfterLock % (stakedDays + ONE));
          } // else locked day was last presumptive locked day
          amount = stakedDays - (today - lockedDay);
        }
      }
      amount = amount > limit ? limit : amount;
    }
  }
  /**
   * compute a useful value from 2 inputs
   * @param method the method to use to compute a result
   * @param x a primary magnitude to use - a constant held in settings - max value (2^64)-1
   * @param y2 a secondary magnitude to use - generally the amount of the end stake
   * @param y1 the starting point of y2 used for deltas
   * @notice funds may never be linked to x variable. X should only hold data that we can plug into
   * an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit
   */
  function _computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y2,
    uint256 y1
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (method < THREE) {
        if (method == ONE) {
          amount = x; // 1
        } else {
          amount = y2; // 2
        }
      } else {
        // shift range from 0-4 iterative 3 to 0-2 iterative 3
        uint256 y = _yDeltas(method % THREE, y2, y1);
        if (y == ZERO) return ZERO;
        // even with uint16 (max: 65535), we can still get down to 0.01% increments
        // with scaling we can go even further (though it is choppier)
        (int256 numerator, uint256 denominator, int256 b) = _decodeLinear(method, x);
        int256 amnt = b + ((numerator * int256(y)) / int256(denominator));
        amount = amnt < 0 ? ZERO : uint256(amnt);
      }
      amount = amount > limit ? limit : amount;
    }
  }
  function _yDeltas(uint256 method, uint256 y2, uint256 y1) internal pure returns(uint256 y) {
    unchecked {
      y = y2;
      if (method == ONE) {
        // y1 only
        y = y1;
      } else if (method == TWO) {
        // yield only
        if (y2 > y1) {
          y = y2 - y1;
        } else {
          y = ZERO;
        }
      }
    }
  }
  function encodeLinear(
    uint256 method,
    uint256 xFactor,
    int256 x,
    uint256 yFactor,
    uint256 y,
    uint256 bFactor,
    int256 b
  ) external pure returns(uint256 encodedMethod, uint256 encodedMagnitude) {
    return _encodeLinear({
      method: method,
      xFactor: xFactor,
      x: x,
      yFactor: yFactor,
      y: y,
      bFactor: bFactor,
      b: b
    });
  }
  /**
   * convert an x/y+b line into a number held in under 72 total bits
   * @param method the method to use (total, principle, yield) when choosing x
   * @param bFactor the scaling factor of b
   * @param b the y intercept
   * @param xFactor the scaling factor of x
   * @param x the x value to use, which will multiply against input
   * @param yFactor the scaling factor of y
   * @param y the y value to use to divide x*input
   * @return encodedMethod the encoded method which can be further encoded using settings uint8
   * @return encodedMagnitude the encoded numbers describing (x/y)+b
   */
  function _encodeLinear(
    uint256 method,
    uint256 xFactor,
    int256 x,
    uint256 yFactor,
    uint256 y,
    uint256 bFactor,
    int256 b
  ) internal pure returns(uint256 encodedMethod, uint256 encodedMagnitude) {
    encodedMethod = ((xFactor + 1) * 3) + method;
    unchecked {
      encodedMagnitude = uint256(
        (uint256(uint16(int16(x)) - uint16(int16(MIN_INT_16))) << FOURTY_EIGHT)
        | (uint256(uint8(yFactor)) << FOURTY)
        | (uint256(uint16(y)) << TWENTY_FOUR)
        | (uint256(uint8(bFactor)) << SIXTEEN)
        | (uint256(uint16(int16(b)) - uint16(int16(MIN_INT_16))))
      );
    }
  }
  /**
   * decode an b+(x/y) slope from a number and scale it to your preference
   * @param method scales the y intercept
   * @param magnitude the uint256 number to decode into b+(x/y)
   * @return x the rise of the line
   * @return y the run of the line
   * @return b the offset of the line
   * @notice this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases
   */
  function decodeLinear(uint256 method, uint256 magnitude) external pure returns (int256 x, uint256 y, int256 b) {
    if (method > MAX_UINT8) revert NotAllowed();
    if (method < THREE) revert NotAllowed(); // under 3 must be handled by client
    return _decodeLinear({
      method: method,
      magnitude: magnitude
    });
  }
  /**
   * decodes an embeded xy+b equation from encoded method and magnitude
   * @param method the factor to raise a constant multipler to expand the b value.
   * @param magnitude an encoded number with b,x,y each uint16 prefixed by scales in uint8
   * @return x the run that a value will be multiplied by
   * @return y the rise that a value can be divided by
   * @return b an offset or y intercept that can displace the ((x+b)/y) in a positive or negative direction
   */
  function _decodeLinear(uint256 method, uint256 magnitude) internal pure returns (int256 x, uint256 y, int256 b) {
    // only first 64 bits of magnitude are read / relevant for our purposes
    // (x*y)+b
    // sfb: scale factor - what power should 16 be raised to
    // 4^84 can get well beyond 100 digits so we should be good there
    // un: uint16(x >> 48) user defined numerator int
    // ud: uint16(x >> 24) user defined denominator uint
    // b:  uint16(x) y intersect as int
    // sfd: scale factor denominator
    // sfn: scale factor numerator
    // sfb: uint8(bFactor)
    unchecked {
      // in order of location on the series of bits
      // numerator
      x = int16(uint16(magnitude >> FOURTY_EIGHT)) + int16(-MIN_INT_16);
      x *= int256(MULTIPLIER ** ((method - THREE) / THREE)); // udn*(2^sfn)*s=n
      // denominator - uint
      y = uint16(magnitude >> TWENTY_FOUR);
      y *= (MULTIPLIER ** uint8(magnitude >> FOURTY)); // udd*(4^sfd)*s=d
      // offset
      b = int16(uint16(magnitude)) + int16(-MIN_INT_16);
      b *= int256(MULTIPLIER ** uint8(magnitude >> SIXTEEN)); // b*(2^sfn)*s=b
    }
  }
  /**
   * compute a magnitude given an x and y
   * @param limit a limit that the uint result can not be greater than
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y2 the second value as input
   * @param y1 the stake to use as an input for the second value
   */
  function computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y2,
    uint256 y1
  ) external pure returns(uint256 result) {
    if (limit == ZERO || method == ZERO) {
      return ZERO;
    }
    return _computeMagnitude({
      limit: limit,
      method: method,
      x: x,
      y2: y2,
      y1: y1
    });
  }
  /**
   * compute a day magnitude given an x and y
   * @param limit a limit that the uint result can not be greater than
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param today the hex day value
   * @param lockedDay the day that the stake was locked
   * @param stakedDays the number of full days that the stake was locked
   */
  function computeDayMagnitude(
    uint256 limit, uint256 method, uint256 x,
    uint256 today, // today
    uint256 lockedDay, // lockedDay
    uint256 stakedDays
  ) external pure returns(uint256 result) {
    if (limit == ZERO || method == ZERO) {
      return ZERO;
    }
    return _computeDayMagnitude({
      limit: limit,
      method: method,
      x: x,
      today: today,
      lockedDay: lockedDay,
      stakedDays: stakedDays
    });
  }
}
