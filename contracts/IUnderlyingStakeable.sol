// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IStakeable.sol";
/**
 * @title IUnderlyingStakeable
 * extends IStakeable and adds single necessary method for getting a stake id
 * this data is held off chain
 * but is necessary for getting the stake id
 * when the stake is first created
 */
interface IUnderlyingStakeable is IStakeable {
  /** get the count of stakes for a staker */
  function stakeCount(address stakerAddr) external view returns (uint256);
}
