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
  /**
   * freeze the progression of a stake to avoid penalties and preserve payout
   * @param stakerAddr the custoidan of the stake
   * @param stakeIndex the index of the stake in question
   * @param stakeIdParam the id of the stake
   */
  function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external;
}
