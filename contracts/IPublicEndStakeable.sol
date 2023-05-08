// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

interface IPublicEndStakeable {
  function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external;
}
