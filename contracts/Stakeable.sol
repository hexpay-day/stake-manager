// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./UnderlyingStakeable.sol";
import "./IStakeable.sol";

abstract contract Stakeable is IStakeable, UnderlyingStakeable {
  /** gets the stake store at a particular index for a staker */
  function stakeLists(address staker, uint256 index) virtual view external returns(StakeStore memory) {
    return _getStake(staker, index);
  }
  /**
   * gets the stake store at the provided index
   * @param index the index of the stake to get
   */
  function _getStake(address custodian, uint256 index) virtual internal view returns(IStakeable.StakeStore memory) {
    return IStakeable(target).stakeLists(custodian, index);
  }
  /** checks the current day */
  function currentDay() virtual external view returns (uint256) {
    return _currentDay();
  }
  function _currentDay() virtual internal view returns(uint256) {
    return IStakeable(target).currentDay();
  }
  function globalInfo() virtual external view returns(uint256[13] memory) {
    return IStakeable(target).globalInfo();
  }
  /**
   * check whether or not the stake is being ended early
   * @param stake the stake in question
   * @param targetDay the day to check whether it will be categorized as ending early
   */
  function isEarlyEnding(StakeStore memory stake, uint256 targetDay) external pure returns(bool) {
    return _isEarlyEnding(stake, targetDay);
  }
  function _isEarlyEnding(StakeStore memory stake, uint256 targetDay) internal pure returns(bool) {
    return (stake.lockedDay + stake.stakedDays) > targetDay;
  }
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) virtual external;
}
