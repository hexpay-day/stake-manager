// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

abstract contract StakeReceiver {
  function onStakeReceived(address from, address owner, uint256 stakeId) external virtual;
}
