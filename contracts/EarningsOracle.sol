// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import { IUnderlyingStakeable } from './IUnderlyingStakeable.sol';
import { IHEX } from './IHEX.sol';
import { Utils } from './Utils.sol';

contract EarningsOracle {
  error NotAllowed();
  address public constant target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  /**
   * @dev this max constraint is very generous given that the sstore opcode costs ~20k gas at the time of writing
   */
  uint256 private MAX_CATCH_UP_DAYS = 1_000;
  uint256 private MAX_TOTAL_PAYOUT = type(uint80).max;
  uint256 private LAST_ZERO_DAY;
  /**
   * @dev uint80 is used here to fit up to 3 uints in a single storage slot to reduce costs down to ~8k gas per day
   * given that the maximum payout for a day is uint72
   * the allocated (total + staked) supply is `650369710099.74046740`
   * and the inflation rate is 3.69% with a hard cap at 179 years, the total payout should be well
   * below the bits needed to store in uint80, even using an updated allocated supply
   * (2^16)/365.25=179.4277891855
   * ((1.0369^179)*(165036971009974046740*0.0369))/(2^80)=0.001302229565
   */
  uint80[] public payoutTotal;
  /**
   * deploy contract and start collecting data immediately.
   * pass 0 for untilDay arg to skip collection and start with nothing in payoutTotal array
   * @param lastZeroDay the final day to allow zero value (used to filter out empty values)
   * @param untilDay the day to end collection
   */
  constructor(uint256 lastZeroDay, uint256 untilDay) {
    LAST_ZERO_DAY = lastZeroDay;
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
  function payoutTotalSize() external view returns(uint256 size) {
    return payoutTotal.length;
  }
  /**
   * the delta between two days. untilDay argument must be greater
   * than startDay argument otherwise call may fail
   * @param startDay the day to start counting from
   * @param untilDay the day to end with (inclusive)
   */
  function payoutDelta(uint256 startDay, uint256 untilDay) external view returns(uint256 delta) {
    return payoutTotal[untilDay] - payoutTotal[startDay];
  }
  /**
   * store the payout total for a given day. day must be the next day in the sequence (start with 0)
   * day must have data available to read from the hex contract
   * @param day the day being targeted
   * @param _previousTotalPayout the total payout logged in the previous day
   * @dev the _previousTotalPayout arg must be handled internally - cannot be passed from external
   */
  function _storeDay(uint256 day, uint256 _previousTotalPayout) internal returns(uint256 previousTotalPayout) {
    if (payoutTotal.length != day) {
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
    previousTotalPayout = dayPayoutTotal + (
      _previousTotalPayout > 0 ? _previousTotalPayout : (
        day > 0 ? payoutTotal[day - 1] : 0
      )
    );
    if (previousTotalPayout > MAX_TOTAL_PAYOUT) {
      // this line is very difficult to test, so it is going to be skipped for now
      revert NotAllowed();
    }
    payoutTotal.push(uint80(previousTotalPayout));
  }
  /**
   * store a singular day, only the next day in the sequence is allowed
   * @param day the day to store
   */
  function storeDay(uint256 day) external returns(uint256 previousTotalPayout) {
    return _storeDay({
      day: day,
      _previousTotalPayout: 0
    });
  }
  /**
   * checks the current day and increments the stored days if not yet covered
   */
  function incrementDay() external returns(uint256 previousTotalPayout, uint256 day) {
    uint256 size = payoutTotal.length;
    if (size >= IHEX(target).currentDay()) {
      // no need to increment
      return (0, 0);
    }
    return (_storeDay({
      day: size,
      _previousTotalPayout: 0
    }), size);
  }
  /**
   * store a range of day payout information. untilDay is exclusive unless startDay and untilDay match
   * @param startDay the day to start storing day information
   * @param untilDay the day to stop storing day information
   */
  function _storeDays(uint256 startDay, uint256 untilDay) internal returns(uint256 previousTotalPayout, uint256 day) {
    do {
      previousTotalPayout = _storeDay({
        day: startDay,
        _previousTotalPayout: previousTotalPayout
      });
      unchecked {
        ++startDay;
      }
    } while (startDay < untilDay);
    return (previousTotalPayout, startDay);
  }
  /**
   * store a range of day payout information. range is not constrained by max catch up days constant
   * nor is it constrained to the current day so if it goes beyond the current day or has not yet been stored
   * then it is subject to failure
   * @param startDay the day to start storing day information
   * @param untilDay the day to stop storing day information. Until day is inclusive
   */
  function storeDays(uint256 startDay, uint256 untilDay) external returns(uint256 previousTotalPayout, uint256 day) {
    return _storeDays({
      startDay: startDay,
      untilDay: untilDay
    });
  }
  /**
   * catch up the contract by reading up to 1_000 days of payout information at a time
   * @param iterations the maximum number of days to iterate over - capped at 1_000 due to sload constraints
   */
  function catchUpDays(uint256 iterations) external returns(uint256 previousTotalPayout, uint256 day) {
    // constrain by gas costs
    iterations = iterations > MAX_CATCH_UP_DAYS ? MAX_CATCH_UP_DAYS : iterations;
    uint256 startDay = payoutTotal.length;
    // add startDay to range size
    iterations += startDay;
    // constrain by startDay
    uint256 limit = IHEX(target).currentDay();
    if (iterations >= limit) {
      iterations = limit;
    }
    return _storeDays({
      startDay: startDay,
      // iterations is used as untilDay to reduce number of variables in stack
      untilDay: iterations
    });
  }
}
