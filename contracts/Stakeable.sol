// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Multicall.sol";
import "./IStakeable.sol";

abstract contract Stakeable is IStakeable, Multicall {
  error NotAllowed();
  /** gets the stake store at a particular index for a staker */
  function stakeLists(address staker, uint256 index) virtual view external returns(StakeStore memory) {
    return IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).stakeLists(staker, index);
  }
  /** checks the current day */
  function currentDay() virtual external view returns (uint256) {
    return IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).currentDay();
  }
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) virtual external;
}
