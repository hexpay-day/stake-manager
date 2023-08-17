// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { IUnderlyingStakeable } from './IUnderlyingStakeable.sol';
import { IHEX } from './IHEX.sol';
import { Utils } from './Utils.sol';

contract EarningsOracle is Utils {
  uint96 private LAST_ZERO_DAY;
  /**
   * @dev this max constraint is very generous given that the sstore opcode costs ~20k gas at the time of writing
   */
  uint128 private MAX_CATCH_UP_DAYS = 1_000;
  uint128 private MAX_TOTAL_PAYOUT = type(uint128).max;
  TotalStore[] public totals;
  struct TotalStore {
    uint128 payout;
    uint128 shares;
  }
  struct Total {
    uint256 payout;
    uint256 shares;
  }
  /**
   * deploy contract and start collecting data immediately.
   * pass 0 for untilDay arg to skip collection and start with nothing in payoutTotal array
   * @param lastZeroDay the final day to allow zero value (used to filter out empty values)
   * @param untilDay the day to end collection
   */
  constructor(uint256 lastZeroDay, uint256 untilDay) {
    LAST_ZERO_DAY = uint96(lastZeroDay);
    if (untilDay > 0) {
      _storeDays({
        startDay: 0,
        untilDay: untilDay
      });
    }
  }
  /**
   * the size of the payoutTotal array - correlates to days stored
   */
  function totalsCount() external view returns(uint256 count) {
    return totals.length;
  }
  /**
   * the delta between two days. untilDay argument must be greater
   * than startDay argument otherwise call may fail
   * @param startDay the day to start counting from
   * @param untilDay the day to end with (inclusive)
   */
  function payoutDelta(uint256 startDay, uint256 untilDay) external view returns(uint256 payout, uint256 shares) {
    TotalStore memory start = totals[startDay];
    TotalStore memory until = totals[untilDay];
    return (
      until.payout - start.payout,
      until.shares - start.shares
    );
  }
  /**
   * multiply the difference of the payout by a constant and divide that result by the denominator
   * subtract half of the difference between the two days to find the possible lower bound
   * @param startDay the day to start counting
   * @param untilDay the day to stop counting
   * @param multiplier a number to multiply by the difference of the payout
   */
  function payoutDeltaTrucated(uint256 startDay, uint256 untilDay, uint256 multiplier) external view returns(uint256 payout) {
    return ((
      (totals[untilDay].payout - totals[startDay].payout) * multiplier
    ) / (
      totals[untilDay].shares - totals[startDay].shares
    )) - (
      (untilDay - startDay) / 2
    );
  }
  /**
   * store the payout total for a given day. day must be the next day in the sequence (start with 0)
   * day must have data available to read from the hex contract
   * @param day the day being targeted
   * @param total the total payout logged in the previous day
   * @dev the _total arg must be handled internally - cannot be passed from external
   */
  function _storeDay(uint256 day, Total memory _total) internal returns(Total memory total) {
    if (totals.length != day) {
      revert NotAllowed();
    }
    (
      uint256 dayPayoutTotal,
      uint256 dayStakeSharesTotal,
      // uint256 dayUnclaimedSatoshisTotal
    ) = IHEX(target).dailyData({
      day: day
    });
    if (day > LAST_ZERO_DAY && dayStakeSharesTotal == 0) {
      // stake data is not yet set
      revert NotAllowed();
    }
    (uint256 payout, uint256 shares) = (_total.payout, _total.shares);
    total.payout = dayPayoutTotal + (
      payout > 0 ? payout : (
        day > 0 ? totals[day - 1].payout : 0
      )
    );
    if (total.payout > MAX_TOTAL_PAYOUT) {
      // this line is very difficult to test, so it is going to be skipped for now
      revert NotAllowed();
    }
    total.shares = dayStakeSharesTotal + (
      shares > 0 ? shares : (
        day > 0 ? totals[day - 1].shares : 0
      )
    );
    if (total.shares > MAX_TOTAL_PAYOUT) {
      // this line is very difficult to test, so it is going to be skipped for now
      revert NotAllowed();
    }
    totals.push(TotalStore({
      payout: uint128(total.payout),
      shares: uint128(total.shares)
    }));
  }
  /**
   * store a singular day, only the next day in the sequence is allowed
   * @param day the day to store
   */
  function storeDay(uint256 day) external returns(Total memory total) {
    return _storeDay({
      day: day,
      _total: Total(0, 0)
    });
  }
  /**
   * checks the current day and increments the stored days if not yet covered
   */
  function incrementDay() external returns(Total memory total, uint256 day) {
    uint256 size = totals.length;
    if (size >= IHEX(target).currentDay()) {
      // no need to increment
      return (total, 0);
    }
    return (_storeDay({
      day: size,
      _total: Total(0, 0)
    }), size);
  }
  /**
   * store a range of day payout information. untilDay is exclusive unless startDay and untilDay match
   * @param startDay the day to start storing day information
   * @param untilDay the day to stop storing day information
   */
  function _storeDays(uint256 startDay, uint256 untilDay) internal returns(Total memory total, uint256 day) {
    if (startDay < untilDay) {
      do {
        total = _storeDay({
          day: startDay,
          _total: total
        });
        unchecked {
          ++startDay;
        }
      } while (startDay < untilDay);
    }
    return (total, startDay);
  }
  /**
   * store a range of day payout information. range is not constrained by max catch up days constant
   * nor is it constrained to the current day so if it goes beyond the current day or has not yet been stored
   * then it is subject to failure
   * @param startDay the day to start storing day information
   * @param untilDay the day to stop storing day information. Until day is inclusive
   */
  function storeDays(uint256 startDay, uint256 untilDay) external returns(Total memory total, uint256 day) {
    return _storeDays({
      startDay: startDay,
      untilDay: untilDay
    });
  }
  /**
   * catch up the contract by reading up to 1_000 days of payout information at a time
   * @param iterations the maximum number of days to iterate over - capped at 1_000 due to sload constraints
   */
  function catchUpDays(uint256 iterations) external returns(Total memory total, uint256 day) {
    // constrain by gas costs
    iterations = iterations > MAX_CATCH_UP_DAYS ? MAX_CATCH_UP_DAYS : iterations;
    uint256 startDay = totals.length;
    // add startDay to range size
    iterations += startDay;
    // constrain by startDay
    uint256 limit = IHEX(target).currentDay();
    if (iterations > limit) {
      iterations = limit;
    }
    return _storeDays({
      startDay: startDay,
      // iterations is used as untilDay to reduce number of variables in stack
      untilDay: iterations
    });
  }
}
