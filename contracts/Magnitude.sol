// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { Utils } from "./Utils.sol";
import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";

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
        amount = _xyMethod(x, _yDeltas(method % THREE, y2, y1), method - THREE);
      }
      amount = amount > limit ? limit : amount;
    }
  }
  function _xyMethod(uint256 x, uint256 y, uint256 method) internal pure returns(uint256 amount) {
    unchecked {
      int256 b;
      int256 numerator;
      uint256 denominator;
      // at this point
      // x (numerator + denominator) only takes up 64 bits
      // at this point, the max number that our method can be is 253
      uint256 scaleFactor = method / THREE;
      // 3-5 is a flag to set "b"
      if (scaleFactor > 0) {
        // if we are here, we should assume that b will probably be set to non 0
        // even with uint16 (max: 65535), we can still get down to 0.01% increments
        // with scaling we can go even further
        (numerator, denominator, b) = _decodeLinear(scaleFactor - ONE, x);
      } else {
        // "b" is 0
        denominator = uint32(x);
        numerator = int256(uint256(uint32(x >> THIRTY_TWO)));
      }
      int256 amnt = b + ((numerator * int256(y)) / int256(denominator));
      amount = amnt < 0 ? ZERO : uint256(amnt);
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
    uint256 _bFactor,
    int256 b,
    uint256 xFactor,
    int256 x,
    uint256 yFactor,
    uint256 y
  ) external pure returns(uint256 bFactor, uint256 input) {
    return _encodeLinear(_bFactor, b,
      xFactor, x,
      yFactor, y
    );
  }
  function _encodeLinear(
    uint256 _bFactor,
    int256 b,
    uint256 xFactor,
    int256 x,
    uint256 yFactor,
    uint256 y
  ) internal pure returns(uint256 bFactor, uint256 input) {
    bFactor = _bFactor;
    unchecked {
      input = uint256(
        (uint256(uint16(int16(b)) - uint16(int16(MIN_INT_16))) << FOURTY_EIGHT)
        | (uint256(uint8(xFactor)) << FOURTY)
        | (uint256(uint16(int16(x)) - uint16(int16(MIN_INT_16))) << TWENTY_FOUR)
        | (uint256(uint8(yFactor)) << SIXTEEN)
        | uint256(uint16(y))
      );
    }
  }
  /**
   * decode an b+(x/y) slope from a number and scale it to your preference
   * @param bFactor scales the y intercept
   * @param input the uint256 number to decode into b+(x/y)
   * @return x the rise of the line
   * @return y the run of the line
   * @return b the offset of the line
   * @notice this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases
   */
  function decodeLinear(uint256 bFactor, uint256 input) external pure returns (int256 x, uint256 y, int256 b) {
    if (bFactor > 84) revert NotAllowed();
    return _decodeLinear(bFactor, input);
  }
  /**
   *
   * @param bFactor the factor to raise a constant multipler to expand the b value.
   * @param input an encoded number with b,x,y each uint16 prefixed by scales in uint8
   * @return x the run that a value will be multiplied by
   * @return y the rise that a value can be divided by
   * @return b an offset or y intercept that can displace the ((x+b)/y) in a positive or negative direction
   */
  function _decodeLinear(uint256 bFactor, uint256 input) internal pure returns (int256 x, uint256 y, int256 b) {
    // only first 64 bits of input are read / relevant for our purposes
    // (x*y)+b
    // sfb: scale factor - what power should 16 be raised to
    // 4^84 can get well beyond 100 digits so we should be good there
    // ud: uint16(x) user defined denominator uint
    // un: uint16(x >> 16) user defined numerator int
    // b:  uint16(x >> 32) y intersect as int
    // sfd: uint8(uint8(x << 10) >> 58) - scale factor denominator
    // sfn: uint8(uint8(x << 5) >> 59) - scale factor numerator
    // sfb: uint8(bFactor)
    unchecked {
      // in order of location on the series of bits
      // denominator
      y = uint16(input) * (MULTIPLIER ** uint8(input >> SIXTEEN)); // udd*(4^sfd)*s=d
      // numerator
      x = int16(uint16(input >> TWENTY_FOUR)) + int16(-MIN_INT_16);
      x *= int256(MULTIPLIER ** uint8(input >> FOURTY)); // udn*(16^sfn)*s=n
      // offset
      b = int16(uint16(input >> FOURTY_EIGHT)) + int16(-MIN_INT_16);
      b *= int256(MULTIPLIER ** bFactor); // b*(16^sfn)*s=b
    }
  }
  /**
   * compute a magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y2 the second value as input
   * @param y1 the stake to use as an input for the second value
   */
  function computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y2,
    uint256 y1
  ) external pure returns(uint256) {
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
  ) external pure returns(uint256) {
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
