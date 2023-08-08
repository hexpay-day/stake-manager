// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * @title IUnderlyingStakeable
 * @notice this is the minimum interface needed to start and end stakes appropriately on hex
 */
interface IUnderlyingStakeable {
  /** the stake store that holds data about the stake */
  struct StakeStore {
    uint40 stakeId;
    uint72 stakedHearts;
    uint72 stakeShares;
    uint16 lockedDay;
    uint16 stakedDays;
    uint16 unlockedDay;
    bool isAutoStake;
  }
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external;
  /** get the count of stakes for a staker */
  function stakeCount(address stakerAddr) external view returns (uint256);
  function globalInfo() external view returns(uint256[13] memory);
  /**
   * freeze the progression of a stake to avoid penalties and preserve payout
   * @param stakerAddr the custoidan of the stake
   * @param stakeIndex the index of the stake in question
   * @param stakeIdParam the id of the stake
   */
  function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external;
  function stakeLists(address staker, uint256 index) view external returns(StakeStore memory);
  function currentDay() external view returns (uint256);
}
