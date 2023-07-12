// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./UnderlyingStakeable.sol";
import "./Bank.sol";
import "./StakeInfo.sol";
import "./Tipper.sol";

contract UnderlyingStakeManager is Stakeable, StakeInfo, Tipper {
  /**
   * start a stake for the staker given the amount and number of days
   * @param staker the underlying owner of the stake
   * @param amount the amount to add to the stake
   * @param newStakedDays the number of days that the stake should run
   */
  function _stakeStartFor(
    address staker,
    uint256 amount,
    uint256 newStakedDays
  ) internal returns(uint256 stakeId) {
    // get future index of stake
    uint256 index = _stakeCount(address(this));
    Stakeable(target).stakeStart(amount, newStakedDays);
    // get the stake id
    stakeId = Stakeable(target).stakeLists(address(this), index).stakeId;
    stakeIdInfo[stakeId] = _encodeInfo(index, staker);
  }
  /**
   * ends a stake for someone else
   * @param stakeIndex the stake index on the underlying contract to end
   * @param stakeId the stake id on the underlying contract to end
   */
  function _stakeEnd(
    uint256 stakeIndex, uint256 stakeId
  ) internal returns(uint256 delta) {
    // calculate the balance before
    // cannot use tokens attributed here because of tipping
    uint256 balanceBefore = _balanceOf(address(this));
    // end the stake - attributed to contract or through the managed stake
    Stakeable(target).stakeEnd(stakeIndex, uint40(stakeId));
    if (_stakeCount(address(this)) > stakeIndex) {
      uint256 shiftingStakeId = _getStake(address(this), stakeIndex).stakeId;
      uint256 stakeInfo = stakeIdInfo[shiftingStakeId];
      stakeIdInfo[shiftingStakeId] = _encodeInfo(stakeIndex, address(uint160(stakeInfo)));
    }
    // because the delta is only available in the logs
    // we need to calculate the delta to use it
    unchecked {
      delta = _balanceOf(address(this)) - balanceBefore;
    }
    stakeIdInfo[stakeId] = 0;
  }
  /**
   * starts a stake from the provided amount
   * @param amount amount of tokens to stake
   * @param newStakedDays the number of days for this new stake
   * @dev this method interface matches the original underlying token contract
   */
  function stakeStart(uint256 amount, uint256 newStakedDays) external override {
    // ensures amount under/from sender is sufficient
    _depositTokenFrom(target, msg.sender, amount);
    _stakeStartFor(msg.sender, amount, newStakedDays);
  }
  /**
   * end your own stake which is custodied by the stake manager. skips tip computing
   * @param stakeIndex the index on the underlying contract to end stake
   * @param stakeId the stake id from the underlying contract to end stake
   * @notice this is not payable to match the underlying contract
   * @notice this moves funds back to the sender to make behavior match underlying token
   * @notice this method only checks that the sender owns the stake it does not care
   * if it is managed in a created contract and externally endable by this contract (1)
   * or requires that the staker send start and end methods (0)
   */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    _verifyStakeOwnership(msg.sender, stakeId);
    uint256 amount = _stakeEnd(stakeIndex, stakeId);
    _withdrawTokenTo(target, payable(msg.sender), amount);
  }
  /**
   * end your own stake which is custodied by the stake manager. skips tip computing
   * @param stakeId the stake id from the underlying contract to end stake
   * @notice this is not payable to match the underlying contract
   * @notice this moves funds back to the sender to make behavior match underlying token
   * @notice this method only checks that the sender owns the stake it does not care
   * if it is managed in a created contract and externally endable by this contract (1)
   * or requires that the staker send start and end methods (0)
   */
  function stakeEndById(uint256 stakeId) external returns(uint256 amount) {
    _verifyStakeOwnership(msg.sender, stakeId);
    (uint256 stakeIndex, ) = _stakeIdToInfo(stakeId);
    amount = _stakeEnd(stakeIndex, stakeId);
    _withdrawTokenTo(target, payable(msg.sender), amount);
  }
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
  function isGoodAccountable(address staker, uint256 index, uint256 stakeId) external view returns(uint256) {
    return _isGoodAccountable(staker, index, stakeId);
  }
  function isStakeIdGoodAccountable(uint256 stakeId) external view returns(uint256) {
    return _isGoodAccountable(address(this), _stakeIdToIndex(stakeId), stakeId);
  }
  function _isGoodAccountable(address staker, uint256 index, uint256 stakeId) internal view returns(uint256) {
    uint256 count = IHEX(target).stakeCount(staker);
    if (index >= count) {
      return 4;
    }
    StakeStore memory stake = _getStake(staker, index);
    if (stake.stakeId != stakeId) {
      // the stake id does not match
      return 3;
    }
    if (_isEarlyEnding(stake.lockedDay, stake.stakedDays, IHEX(target).currentDay())) {
      // return if it is too early to run good accounting
      return 2;
    }
    if (stake.unlockedDay > 0) {
      // the stake has already been ended
      return 1;
    }
    return 0;
  }
  function _checkStakeGoodAccounting(address staker, uint256 index, uint256 stakeId) internal {
    if (_isGoodAccountable(staker, index, stakeId) == 0) {
      _stakeGoodAccounting(staker, index, stakeId);
    }
  }
}
