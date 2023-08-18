// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { IUnderlyingStakeable } from "./IUnderlyingStakeable.sol";
import { Utils } from "./Utils.sol";

contract Magnitude is Utils {
  /**
   * compute a useful value from 2 inputs
   * @param method the method to use to compute a result
   * @param x a primary magnitude to use - a constant held in settings - max value (2^64)-1
   * @param y a secondary magnitude to use - generally the amount of the end stake
   * @param stake the stake being operated over
   */
  function _computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    IUnderlyingStakeable.StakeStore memory stake
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (method < FOUR) {
        if (method < THREE) {
          if (method == ONE) amount = x; // 1
          else {
            amount = stake.stakedDays; // 2 - repeat number of days
          }
        } else {
          uint256 stakedDays = stake.stakedDays;
          // 3 - start an equally spaced ladder, even if end stake happens late
          uint256 lockedDay = stake.lockedDay;
          uint256 daysAfterLock = y - lockedDay;
          if (daysAfterLock == stakedDays) amount = stakedDays; // ended on first available day (most cases)
          else {
            // did not end on first available day
            if (daysAfterLock >= stakedDays) {
              // presumptive value extrapolated backward
              lockedDay = y - (daysAfterLock % (stakedDays + ONE));
            } // else locked day was last presumptive locked day
            amount = stakedDays - (y - lockedDay);
          }
        }
      } else {
        // y = y: 4 - (default: total)
        if (method == FIVE) {
          // principle only
          y = stake.stakedHearts;
        } else if (method == SIX) {
          // yield only
          if (y > stake.stakedHearts) {
            y = y - stake.stakedHearts;
          }
        }
        uint256 denominator = uint32(x);
        uint256 numerator = uint32(x >> THIRTY_TWO);
        amount = (numerator * y) / denominator;
      }
    }
    amount = amount > limit ? limit : amount;
  }
  /**
   * compute a magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y the second value as input
   */
  function computeMagnitude(
    uint256 limit, uint256 method, uint256 x, uint256 y,
    IUnderlyingStakeable.StakeStore memory stake
  ) external pure returns(uint256) {
    if (limit  == ZERO || method == ZERO) {
      return ZERO;
    }
    return _computeMagnitude({
      limit: limit,
      method: method,
      x: x,
      y: y,
      stake: stake
    });
  }
}
