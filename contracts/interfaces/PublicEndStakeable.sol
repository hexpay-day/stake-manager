// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

abstract contract PublicEndStakeable {
  function STAKE_END_DAY() external virtual view returns(uint256);
  function STAKE_IS_ACTIVE() external virtual view returns(bool);
  function mintEndBonusCom(uint256 stakeIndex, uint40 stakeIdParam) external virtual;
  function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external virtual;
  function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external virtual;
  function getCurrentPeriod() external virtual view returns (uint256);
  function getEndStaker() external virtual view returns(address end_staker_address);
}
