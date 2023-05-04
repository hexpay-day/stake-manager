// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * @title IStakeable
 * @notice this is the minimum interface needed to start and end stakes appropriately on hex
 */
interface IStakeable {
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
  /** gets the stake store at a particular index for a staker */
  function stakeLists(address staker, uint256 index) view external returns(StakeStore memory);
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external;
  /** checks the current day */
  function currentDay() external view returns (uint256);
}
