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
    return IStakeable(target).stakeLists(staker, index);
  }
  /** checks the current day */
  function currentDay() virtual external view returns (uint256) {
    return IStakeable(target).currentDay();
  }
  function globalInfo() virtual external view returns(uint256[13] memory) {
    return IStakeable(target).globalInfo();
  }
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) virtual external;
}
