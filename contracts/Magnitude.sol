// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import { Utils } from "./Utils.sol";
import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";

contract Magnitude is Utils {
  uint256 constant internal X_OPTIONS = THREE;
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
          // presumptive value extrapolated backward
          lockedDay = today - (daysAfterLock % (stakedDays + ONE));
          // else locked day was last presumptive locked day
          amount = stakedDays - (today - lockedDay);
        }
      }
      amount = amount > limit ? limit : amount;
    }
  }
  /**
   * compute a useful value from 2 inputs
   * @param linear holds the linear data to describe how to plot a provied y value
   * @param v2 a secondary magnitude to use - generally the amount of the end stake
   * @param v1 the starting point of v2 used for deltas
   * @notice funds may never be linked to x variable. X should only hold data that we can plug into
   * an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit
   */
  function _computeMagnitude(
    uint256 limit, Linear memory linear,
    uint256 v2, uint256 v1
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (linear.xFactor == ZERO) {
        if (linear.method == ONE) {
          amount = linear.y; // 1
        } else {
          amount = v2; // 2
        }
      } else {
        uint256 delta = _getDelta(linear.method, v2, v1);
        if (delta == ZERO) return ZERO;
        // even with uint16 (max: 65535), we can still get down to 0.01% increments
        // with scaling we can go even further (though it is choppier)
        // x has an embedded 1 offset from upper if statement
        int256 x = linear.x << (linear.xFactor - ONE);
        uint256 y = linear.y << linear.yFactor;
        int256 b = linear.b << linear.bFactor;
        int256 amnt = ((x * int256(delta)) / int256(y)) + b;
        amount = amnt < 0 ? ZERO : uint256(amnt);
      }
      amount = amount > limit ? limit : amount;
    }
  }
  function _getDelta(uint256 method, uint256 v2, uint256 v1) internal pure returns(uint256 y) {
    unchecked {
      y = v2;
      if (method == ONE) {
        // v1 only
        y = v1;
      } else if (method == TWO) {
        // yield only
        if (v2 > v1) {
          y = v2 - v1;
        } else {
          y = ZERO;
        }
      }
    }
  }
  struct Linear {
    uint256 method;
    uint256 xFactor;
    int256 x;
    uint256 yFactor;
    uint256 y;
    uint256 bFactor;
    int256 b;
  }
  function encodeLinear(Linear calldata linear) external pure returns(uint256 encoded) {
    return _encodeLinear(linear);
  }
  /**
   * convert an x/y+b linear struct into a number held in under 72 total bits
   * @param linear the struct with all relevant linear data in it
   * @return encoded the encoded numbers describing (x/y)+b
   */
  function _encodeLinear(Linear memory linear) internal pure returns(uint256 encoded) {
    if (linear.method >= X_OPTIONS) revert NotAllowed();
    if (linear.xFactor == ZERO) {
      return uint72(
        linear.y << EIGHT
        | uint8(linear.method)
      );
    }
    // xFactor must be > 0
    unchecked {
      return uint256(
        (uint256(uint16(int16(linear.x)) - uint16(int16(MIN_INT_16))) << FIFTY_SIX)
        | (uint256(uint8(linear.yFactor)) << FOURTY_EIGHT)
        | (uint256(uint16(linear.y)) << THIRTY_TWO)
        | (uint256(uint8(linear.bFactor)) << TWENTY_FOUR)
        | (uint256(uint16(int16(linear.b)) - uint16(int16(MIN_INT_16))) << EIGHT)
        | uint256(uint8((linear.xFactor * X_OPTIONS) + linear.method))
      );
    }
  }
  /**
   * decode an b+(x/y) slope from a number and scale it to your preference
   * @param encodedLinear holds all relevant data for filling out a Linear struct
   * @return linear the full set of parameters to describe a (x/y)+b pattern
   * @notice this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases
   */
  function decodeLinear(uint256 encodedLinear) external pure returns (Linear memory linear) {
    return _decodeLinear({
      encodedLinear: encodedLinear
    });
  }
  function _decodeLinear(uint256 encodedLinear) internal pure returns (Linear memory linear) {
    // only first 72 bits of magnitude are read / relevant for our purposes
    unchecked {
      uint256 method = uint8(encodedLinear);
      linear.xFactor = method / X_OPTIONS;
      linear.method = method % X_OPTIONS;
      // when xFactor is 0, nothing below makes a difference except y
      if (linear.xFactor == ZERO) {
        // y is being used because it is the only uint
        linear.y = uint64(encodedLinear >> EIGHT);
        return linear;
      }
      // numerator
      linear.x = int16(uint16(encodedLinear >> FIFTY_SIX)) + int16(-MIN_INT_16);
      // denominator - uint
      linear.yFactor = uint256(uint8(encodedLinear >> FOURTY_EIGHT)); // udd*(4^sfd)=d
      linear.y = uint16(encodedLinear >> THIRTY_TWO);
      // offset
      linear.bFactor = uint256(uint8(encodedLinear >> TWENTY_FOUR)); // b*(2^sfn)=b
      linear.b = int16(uint16(encodedLinear >> EIGHT)) + int16(-MIN_INT_16);
    }
  }
  /**
   * compute a magnitude given an x and y
   * @param limit a limit that the uint result can not be greater than
   * @param linear the linear data to describe an (x/y)+b relationship
   * @param v2 the second value as input
   * @param v1 the stake to use as an input for the second value
   */
  function computeMagnitude(
    uint256 limit, Linear calldata linear,
    uint256 v2, uint256 v1
  ) external pure returns(uint256 result) {
    if (limit == ZERO || (linear.method == ZERO && linear.xFactor == ZERO)) {
      return ZERO;
    }
    return _computeMagnitude({
      limit: limit,
      linear: linear,
      v2: v2,
      v1: v1
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
    uint256 today,
    uint256 lockedDay,
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
