// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { ERC721 } from "solmate/src/tokens/ERC721.sol";

abstract contract HEXStakeInstanceManager is ERC721 {
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
  function hsiLists(address generator, uint256 index) external virtual view returns(address);
  function hsiCount(address originator) external virtual view returns(uint256);
  function hexStakeDetokenize (uint256 tokenId) external virtual returns (address);
  function hexStakeTokenize (uint256 hsiIndex, address hsiAddress) external virtual returns (uint256);
  function hexStakeEnd (uint256 hsiIndex, address hsiAddress) external virtual returns (uint256);
  function hexStakeStart (uint256 amount, uint256 length) external virtual returns (address);
  function hsiToken(uint256 tokenId) external virtual view returns(address);
  function tokenOfOwnerByIndex(address account, uint256 index) external virtual view returns(uint256);
}
