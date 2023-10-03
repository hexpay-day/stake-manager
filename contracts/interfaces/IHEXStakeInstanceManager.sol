// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

interface IHEXStakeInstanceManager {
  event HSIStart(
    uint256         timestamp,
    address indexed hsiAddress,
    address indexed staker
  );

  event HSIEnd(
    uint256         timestamp,
    address indexed hsiAddress,
    address indexed staker
  );

  event HSITransfer(
    uint256         timestamp,
    address indexed hsiAddress,
    address indexed oldStaker,
    address indexed newStaker
  );

  event HSITokenize(
    uint256         timestamp,
    uint256 indexed hsiTokenId,
    address indexed hsiAddress,
    address indexed staker
  );

  event HSIDetokenize(
    uint256         timestamp,
    uint256 indexed hsiTokenId,
    address indexed hsiAddress,
    address indexed staker
  );
  function hsiLists(address generator, uint256 index) external view returns(address);
  function hsiCount(address originator) external view returns(uint256);
  function hexStakeDetokenize (uint256 tokenId) external returns (address);
  function hexStakeTokenize (uint256 hsiIndex, address hsiAddress) external returns (uint256);
  function hexStakeEnd (uint256 hsiIndex, address hsiAddress) external returns (uint256);
  function hexStakeStart (uint256 amount, uint256 length) external returns (address);
  function hsiToken(uint256 tokenId) external view returns(address);
  function balanceOf(address account) external view returns(uint256);
  function tokenOfOwnerByIndex(address account, uint256 index) external view returns(uint256);
  function isApprovedForAll(address owner, address operator) external view returns(bool);
  function getApproved(uint256 tokenId) external view returns(address);
}
