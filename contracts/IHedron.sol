// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IHedron is IERC20 {
  function hsim() external returns(address);
  function mintInstanced(uint256 hsiIndex, address hsiAddress) external returns (uint256);
  function mintNative(uint256 stakeIndex, uint40 stakeId) external returns (uint256);
  function hexStakeEnd (uint256 hsiIndex, address hsiAddress) external returns (uint256);
  function hexStakeStart (uint256 amount, uint256 length) external returns (address);
  function hexStakeDetokenize (uint256 tokenId) external returns (address);
}
