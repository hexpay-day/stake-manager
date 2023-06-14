// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";
import "./IStakeable.sol";

abstract contract Stakeable is IStakeable, Multicall, UnderlyingStakeable {
  error NotAllowed();
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
  function isCapable(uint256 setting, uint256 index) external pure returns(bool) {
    return checkBinary(setting, index);
  }
  function checkBinary(uint256 setting, uint256 index) internal pure returns(bool) {
    // in binary checks:
    // take the setting and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    return 1 == (setting << (255 - index) >> 255);
  }
  function isEarlyEnding(StakeStore memory stake, uint256 targetDay) internal pure returns(bool) {
    return (stake.lockedDay + stake.stakedDays) < targetDay;
  }
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) virtual external;
}
