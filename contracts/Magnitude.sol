// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IStakeable.sol";

contract Magnitude {
  /**
   * compute a useful value from 2 inputs
   * @param method the method to use to compute a result
   * @param x a primary magnitude to use - a constant held in settings - max value (2^64)-1
   * @param y a secondary magnitude to use - generally the amount of the end stake
   * @param stake the stake being operated over
   */
  function _computeMagnitude(
    uint256 method, uint256 x, uint256 y,
    IStakeable.StakeStore memory stake
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (method > 0) {
        if (method < 4) {
          if (method < 3) {
            if (method == 1) amount = x; // 1
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
                lockedDay = y - (daysAfterLock % (stakedDays + 1));
              } // else locked day was last presumptive locked day
              amount = stakedDays - (y - lockedDay);
            }
          }
        } else {
          // y = y: 4 - (default: total)
          if (method == 5) {
            // principle only
            y = stake.stakedHearts;
          } else if (method == 6) {
            // yield only
            y = y - stake.stakedHearts;
          }
          uint256 denominator = uint32(x);
          uint256 numerator = uint32(x >> 32);
          amount = (numerator * y) / denominator;
        }
      }
    }
  }
  /**
   * check the tip amount of a stake given a setting and limit
   * @param setting a method (8) and magnitude (64) pairing
   * @param limit the amount that the derived value cannot exceed
   * @param stake the stake in question
   */
  function _checkTipAmount(
    uint256 setting,
    uint256 limit,
    IStakeable.StakeStore memory stake
  ) internal pure returns(uint256 tip) {
    uint256 method = uint8(setting >> 64);
    if (method > 0) {
      tip = _computeMagnitude(method, uint64(setting), limit, stake);
      tip = tip > limit ? limit : tip;
    }
  }
  function checkTipAmount(
    uint256 setting,
    uint256 limit,
    IStakeable.StakeStore memory stake
  ) external pure returns(uint256 tip) {
    return _checkTipAmount(setting, limit, stake);
  }
  /**
   * compute a magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y the second value as input
   */
  function computeMagnitude(
    uint256 method, uint256 x, uint256 y,
    IStakeable.StakeStore memory stake
  ) external pure returns(uint256) {
    return _computeMagnitude(method, x, y, stake);
  }
}