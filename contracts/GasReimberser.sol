// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IGasReimberser {
  function flush() external;
  function flush_erc20(address token) external;
}

contract GasReimberser is IGasReimberser {
  function flush() external {}
  function flush_erc20(address token) external {}
}
