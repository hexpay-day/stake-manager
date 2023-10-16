// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

abstract contract GasReimberser {
  function flush() external virtual;
  function flush_erc20(address token) external virtual;
}
