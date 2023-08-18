// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IUnderlyingStakeable.sol";
import "./IHedron.sol";
import "./IHEX.sol";
import "./Multicall.sol";
import "./Utils.sol";

abstract contract UnderlyingStakeable is Multicall, Utils, IUnderlyingStakeable {
  /**
   * gets the stake store at the provided index
   * @param index the index of the stake to get
   */
  function _getStake(address custodian, uint256 index) virtual internal view returns(StakeStore memory) {
    return IUnderlyingStakeable(TARGET).stakeLists(custodian, index);
  }
  function stakeCount(address staker) external view returns(uint256) {
    return _stakeCount({
      staker: staker
    });
  }
  function _stakeCount(address staker) internal view returns(uint256) {
    return IUnderlyingStakeable(TARGET).stakeCount(staker);
  }
  function balanceOf(address owner) external view returns(uint256) {
    return _balanceOf({
      owner: owner
    });
  }
  function _balanceOf(address owner) internal view returns(uint256) {
    return IERC20(TARGET).balanceOf(owner);
  }
  /** gets the stake store at a particular index for a staker */
  function stakeLists(address staker, uint256 index) view external returns(StakeStore memory) {
    return _getStake({
      custodian: staker,
      index: index
    });
  }
  /** checks the current day */
  function currentDay() external view returns (uint256) {
    return _currentDay();
  }
  function _currentDay() internal view returns(uint256) {
    return IUnderlyingStakeable(TARGET).currentDay();
  }
  function globalInfo() external view returns(uint256[13] memory) {
    return IUnderlyingStakeable(TARGET).globalInfo();
  }
  /**
   * check whether or not the stake is being ended early
   * @param lockedDay the day after the stake was locked
   * @param stakedDays the number of days that the stake is locked
   * @param targetDay the day to check whether it will be categorized as ending early
   */
  function isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) external pure returns(bool) {
    return _isEarlyEnding({
      lockedDay: lockedDay,
      stakedDays: stakedDays,
      targetDay: targetDay
    });
  }
  function _isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) internal pure returns(bool) {
    return (lockedDay + stakedDays) > targetDay;
  }
  /**
   * freeze the progression of a stake to avoid penalties and preserve payout
   * @param stakerAddr the originating stake address
   * @param stakeIndex the index of the stake on the address
   * @param stakeIdParam the stake id to verify the same stake is being targeted
   */
  function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external {
    _stakeGoodAccounting({
      stakerAddr: stakerAddr,
      stakeIndex: stakeIndex,
      stakeIdParam: stakeIdParam
    });
  }
  function _stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint256 stakeIdParam) internal {
    // no data is marked during good accounting, only computed and placed into logs
    // so we cannot return anything useful to the caller of this method
    IUnderlyingStakeable(TARGET).stakeGoodAccounting(stakerAddr, stakeIndex, uint40(stakeIdParam));
  }
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external virtual;
}
