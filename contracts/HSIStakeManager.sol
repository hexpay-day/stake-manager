// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./Multicall.sol";
import "./AuthorizationManager.sol";

contract HSIStakeManager is AuthorizationManager {
  mapping(address => mapping(uint256 => address)) public tokenOwner;
  mapping(address => address) public hsiToOwner;
  address constant hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  constructor() AuthorizationManager(7) {}
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId) external {
    address token = IHedron(hedron).hsim();
    address owner = _deposit721(token, tokenId);
    address hsiAddress = IHedron(hedron).hexStakeDetokenize(tokenId);
    // erc721 is burned - no owner - only hsi address remains
    hsiToOwner[hsiAddress] = owner;
  }
  function setAuthorization(address runner, address hsiAddress, uint256 setting) external {
    if (hsiToOwner[hsiAddress] != msg.sender) {
      revert NotAllowed();
    }
    _setAuthorization(keccak256(abi.encode(runner, hsiAddress)), setting);
  }
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  function _withdraw721(address token, address to, uint256 tokenId) internal {
    if (msg.sender != tokenOwner[token][tokenId]) {
      revert NotAllowed();
    }
    delete tokenOwner[token][tokenId];
    IERC721(token).transferFrom(address(this), to, tokenId);
  }
  struct HSIParams {
    uint96 hsiIndex;
    address hsiAddress;
  }
  /**
   * mint rewards and transfer them to a provided address
   * @param params variable params for each call
   * @notice any combination of owners can be passed, however, it is most efficient to order the hsi address by owner
   */
  function mintRewards(HSIParams[] calldata params) external {
    uint256 len = params.length;
    uint256 i;
    uint256 hedronTokens;
    address hsiAddress = params[0].hsiAddress;
    address currentOwner;
    address to = hsiToOwner[hsiAddress];
    do {
      hsiAddress = params[i].hsiAddress;
      if (isAuthorized(keccak256(abi.encode(msg.sender, hsiAddress)), 0)) {
        currentOwner = hsiToOwner[hsiAddress];
        if (currentOwner != to) {
          IERC20(hedron).transfer(to, hedronTokens);
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += IHedron(hedron).mintInstanced(params[i].hsiIndex, hsiAddress);
      }
      ++i;
    } while (i < len);
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
  }
  /**
   * end multiple stakes, and mint final tokens
   * @param params the hsi index and address to interact with
   */
  function hsiStakeEndMany(HSIParams[] calldata params) external {
    uint256 len = params.length;
    uint256 targetTokens;
    uint256 hedronTokens;
    uint256 i;
    address runner = msg.sender;
    address hsiAddress = params[0].hsiAddress;
    uint256 index;
    address currentOwner;
    address to = hsiToOwner[hsiAddress];
    do {
      hsiAddress = params[i].hsiAddress;
      if (isAuthorized(keccak256(abi.encode(msg.sender, hsiAddress)), 1)) {
        currentOwner = hsiToOwner[hsiAddress];
        if (currentOwner != to) {
          _payout(to, hedronTokens, targetTokens);
          hedronTokens = 0;
          targetTokens = 0;
        }
        if (runner == hsiToOwner[hsiAddress]) {
          index = params[i].hsiIndex;
          hedronTokens += IHedron(hedron).mintInstanced(index, hsiAddress);
          targetTokens += IHedron(hedron).hexStakeEnd(index, hsiAddress);
        }
      }
      ++i;
    } while (i < len);
    _payout(to, hedronTokens, targetTokens);
  }
  function _payout(
    address to,
    uint256 hedronTokens,
    uint256 targetTokens
  ) internal {
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
    if (targetTokens > 0) {
      IERC20(target).transfer(to, targetTokens);
    }
  }
}