// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./UnderlyingStakeable.sol";
import "./Bank.sol";
import "./StakeInfo.sol";
import "./Tipper.sol";

abstract contract GoodAccounting is Stakeable, StakeInfo, Tipper {
  /**
   * freeze the progression of a stake to avoid penalties and preserve payout
   * @param stakerAddr the originating stake address
   * @param stakeIndex the index of the stake on the address
   * @param stakeIdParam the stake id to verify the same stake is being targeted
   */
  function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external {
    _stakeGoodAccounting(stakerAddr, stakeIndex, stakeIdParam);
  }
  function _stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint256 stakeIdParam) internal {
    // no data is marked during good accounting, only computed and placed into logs
    // so we cannot return anything useful to the caller of this method
    IHEX(target).stakeGoodAccounting(stakerAddr, stakeIndex, uint40(stakeIdParam));
  }
  /**
   * check that the provided stake can be ended and end it
   * @param stakeId the stake id to end as custodied by this contract
   */
  function checkStakeGoodAccounting(uint256 stakeId) external {
    _checkStakeGoodAccounting(address(this), _stakeIdToIndex(stakeId), stakeId);
  }
  /**
   * check that the stake can be good accounted, and execute the method if it will not fail
   * @param staker the custodian of the provided stake
   * @param index the index of the stake
   * @param stakeId the stake id of the stake
   */
  function checkStakeGoodAccountingFor(address staker, uint256 index, uint256 stakeId) external {
    _checkStakeGoodAccounting(staker, index, stakeId);
  }
  /**
   * run the appropriate checks if the stake is good accountable.
   * return 0 if it can be good accounted
   * return other numbers for those failed conditions
   * @param staker the custodian of the provided stake
   * @param index the index of the stake
   * @param stakeId the stake id of the stake
   */
  function isGoodAccountable(address staker, uint256 index, uint256 stakeId) external view returns(GoodAccountingStatus) {
    return _isGoodAccountable(staker, index, stakeId);
  }
  function isStakeIdGoodAccountable(uint256 stakeId) external view returns(GoodAccountingStatus) {
    return _isGoodAccountable(address(this), _stakeIdToIndex(stakeId), stakeId);
  }
  enum GoodAccountingStatus {
    READY,
    ENDED,
    EARLY,
    MISMATCH,
    MISCOUNT
  }
  function _isGoodAccountable(address staker, uint256 index, uint256 stakeId) internal view returns(GoodAccountingStatus) {
    uint256 count = IHEX(target).stakeCount(staker);
    if (index >= count) {
      return GoodAccountingStatus.MISCOUNT;
    }
    StakeStore memory stake = _getStake(staker, index);
    if (stake.stakeId != stakeId) {
      // the stake id does not match
      return GoodAccountingStatus.MISMATCH;
    }
    if (_isEarlyEnding(stake.lockedDay, stake.stakedDays, IHEX(target).currentDay())) {
      // return if it is too early to run good accounting
      return GoodAccountingStatus.EARLY;
    }
    if (stake.unlockedDay > 0) {
      // the stake has already been ended
      return GoodAccountingStatus.ENDED;
    }
    return GoodAccountingStatus.READY;
  }
  function _checkStakeGoodAccounting(address staker, uint256 index, uint256 stakeId) internal {
    if (_isGoodAccountable(staker, index, stakeId) == GoodAccountingStatus.READY) {
      _stakeGoodAccounting(staker, index, stakeId);
    }
  }
}