// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IStakeable.sol";
import "./IHedron.sol";
import "./IHEX.sol";
import "./Multicall.sol";
import "./Utils.sol";

contract UnderlyingStakeable is Multicall, Utils {
  address public constant target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public constant hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  address public constant hsim = 0x8BD3d1472A656e312E94fB1BbdD599B8C51D18e3;
  /**
   * gets the stake store at the provided index
   * @param index the index of the stake to get
   */
  function _getStake(address custodian, uint256 index) virtual internal view returns(IStakeable.StakeStore memory) {
    return IHEX(target).stakeLists(custodian, index);
  }
  function stakeCount(address staker) external view returns(uint256) {
    return _stakeCount(staker);
  }
  function _stakeCount(address staker) internal view returns(uint256) {
    return IHEX(target).stakeCount(staker);
  }
  function balanceOf(address owner) external view returns(uint256) {
    return _balanceOf(owner);
  }
  function _balanceOf(address owner) internal view returns(uint256) {
    return IERC20(target).balanceOf(owner);
  }
  /** gets the stake store at a particular index for a staker */
  function stakeLists(address staker, uint256 index) view external returns(IStakeable.StakeStore memory) {
    return _getStake(staker, index);
  }
  /** checks the current day */
  function currentDay() external view returns (uint256) {
    return _currentDay();
  }
  function _currentDay() internal view returns(uint256) {
    return IHEX(target).currentDay();
  }
  function globalInfo() external view returns(uint256[13] memory) {
    return IHEX(target).globalInfo();
  }
  /**
   * check whether or not the stake is being ended early
   * @param lockedDay the day after the stake was locked
   * @param stakedDays the number of days that the stake is locked
   * @param targetDay the day to check whether it will be categorized as ending early
   */
  function isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) external pure returns(bool) {
    return _isEarlyEnding(lockedDay, stakedDays, targetDay);
  }
  function _isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) internal pure returns(bool) {
    return (lockedDay + stakedDays) > targetDay;
  }
}
