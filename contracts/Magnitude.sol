// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import "hardhat/console.sol";

contract Magnitude {
  uint256 constant internal MULTIPLIER = 1_000_000;
  int256 constant internal MIN_INT_24 = type(int24).min;
  function _computeDayMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    UnderlyingStakeable.StakeStore memory stake
  ) internal pure returns(uint256 amount) {
    unchecked {
      if (method < 3) {
        if (method == 1) {
          amount = x; // 1
        }
        else {
          amount = stake.stakedDays; // 2 - repeat number of days
        }
      } else {
        uint256 stakedDays = stake.stakedDays;
        // 3 - start an equally spaced ladder, even if end stake happens late
        uint256 lockedDay = stake.lockedDay;
        uint256 daysAfterLock = y - lockedDay;
        if (daysAfterLock == stakedDays) {
          amount = stakedDays; // ended on first available day (most cases)
        } else {
          // did not end on first available day
          if (daysAfterLock >= stakedDays) {
            // presumptive value extrapolated backward
            lockedDay = y - (daysAfterLock % (stakedDays + 1));
          } // else locked day was last presumptive locked day
          amount = stakedDays - (y - lockedDay);
        }
      }
      amount = amount > limit ? limit : amount;
    }
  }
  /**
   * compute a useful value from 2 inputs
   * @param method the method to use to compute a result
   * @param x a primary magnitude to use - a constant held in settings - max value (2^64)-1
   * @param y a secondary magnitude to use - generally the amount of the end stake
   * @param stake the stake being operated over
   * @notice funds may never be linked to x variable. X should only hold data that we can plug into
   * an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit
   */
  function _computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    UnderlyingStakeable.StakeStore memory stake
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (method == 1) {
        amount = x; // 1;
      } else {
        int256 b;
        uint256 numerator;
        uint256 denominator;
        // at this point
        // x (numerator + denominator) only takes up 64 bits
        // shift range from 0-4 iterative 3 to 0-2 iterative 3
        method -= 2;
        // 3-5 is a flag to set "b"
        if (method / 3 > 0) {
          // if we are here, we should assume that b should be set to non 0
          // chunk data down to 8 and 24 bits
          uint256 list = uint8(x >> 56);
          b = int256(
            x << 200 /* 256-(64-8) */
            >> 232     /* 256-(56-24) */
          ) + MIN_INT_24; // 24 bits left
          // even with uint16 (max: 65535), we can still get down to 0.0015% increments
          numerator = uint16(x >> 16);
          denominator = uint16(x);
          denominator *= (MULTIPLIER ** (uint8(list << 5) >> 5) /* up to 1e48 */);
          numerator *= (MULTIPLIER ** (uint8(list << 2) >> 5) /* up to 1e48 */);
          b *= int256((MULTIPLIER ** uint8(list >> 6) /* up to 1e24 */));
        } else {
          // "b" is 0
          denominator = uint32(x);
          numerator = uint32(x >> 32);
        }
        method %= 3;
        // y = y: 4 - (default: total)
        if (method == 1 /* 5 */) {
          // principle only
          y = stake.stakedHearts;
        } else if (method == 2 /* 6 */) {
          // yield only
          if (y > stake.stakedHearts) {
            y = y - stake.stakedHearts;
          }
        }
        int256 amnt = (b + int256(numerator * y)) / int256(denominator);
        amount = amnt < 0 ? 0 : uint256(amnt);
      }
      amount = amount > limit ? limit : amount;
    }
  }
  /**
   * compute a magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y the second value as input
   */
  function computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    UnderlyingStakeable.StakeStore memory stake
  ) external pure returns(uint256) {
    if (limit == 0 || method == 0) {
      return 0;
    }
    return _computeMagnitude({
      limit: limit,
      method: method,
      x: x,
      y: y,
      stake: stake
    });
  }
  /**
   * compute a day magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y the second value as input
   */
  function computeDayMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    UnderlyingStakeable.StakeStore memory stake
  ) external pure returns(uint256) {
    if (limit == 0 || method == 0) {
      return 0;
    }
    return _computeDayMagnitude({
      limit: limit,
      method: method,
      x: x,
      y: y,
      stake: stake
    });
  }
}
