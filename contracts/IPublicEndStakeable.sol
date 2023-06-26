// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface IPublicEndStakeable {
  function STAKE_END_DAY() external returns(uint256);
  function STAKE_IS_ACTIVE() external returns(bool);
  function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external;
  function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external;
  function getCurrentPeriod() external view returns (uint256);
}
