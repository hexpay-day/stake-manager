// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";

contract HSIStakeManager is UnderlyingStakeable, Multicall {
  error NotEnoughFunding(uint256 provided, uint256 expected);
  error NotAllowed();
  mapping(address => mapping(uint256 => address)) public tokenOwner;
  mapping(address => address) public hsiToOwner;
  address constant hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  address constant waatsa = 0x2520E62474bA3085693f856B3E93fa6C92a4EF48;
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
  function withdrawHsiTo(address to, uint256 tokenId) external {
    _withdraw721(IHedron(hedron).hsim(), to, tokenId);
  }
  function depositWaatsa(uint256 tokenId) external {
    tokenOwner[waatsa][tokenId] = _deposit721(waatsa, tokenId);
  }
  function withdrawWaatsa(address to, uint256 tokenId) external {
    _withdraw721(waatsa, to, tokenId);
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
  struct RewardParams {
    uint96 hsiIndex;
    address hsiAddress;
  }
  /**
   * mint rewards and transfer them to a provided address
   * @param to where to send reward (hedron) tokens to
   * @param params variable params for each call
   * @notice this is a permissioned call - you need to be registered
   * as the owner in order to mint rewards to an address
   */
  function mintRewardsTo(address to, RewardParams[] calldata params) external {
    uint256 len = params.length;
    uint256 i;
    uint256 hedronTokens;
    address runner = msg.sender;
    address hsiAddress;
    do {
      hsiAddress = params[i].hsiAddress;
      if (hsiToOwner[hsiAddress] == runner) {
        hedronTokens += IHedron(hedron).mintInstanced(params[i].hsiIndex, hsiAddress);
      }
      ++i;
    } while (i < len);
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
  }
  struct StakeEndParams {
    bool mintFirst;
    uint88 hsiIndex;
    address hsiAddress;
  }
  /**
   * end multiple stakes, and mint final tokens
   * @param to ends a stake and transfers resulting
   * @param params the hsi index and address to interact with
   */
  function hsiStakeEndMany(address to, StakeEndParams[] calldata params) external {
    uint256 len = params.length;
    uint256 payout;
    uint256 hedronTokens;
    uint256 i;
    address runner = msg.sender;
    address hsiAddress;
    uint256 index;
    do {
      hsiAddress = params[i].hsiAddress;
      if (runner == hsiToOwner[hsiAddress]) {
        index = params[i].hsiIndex;
        if (params[i].mintFirst) {
          hedronTokens += IHedron(hedron).mintInstanced(index, hsiAddress);
        }
        payout += IHedron(hedron).hexStakeEnd(index, hsiAddress);
      }
      ++i;
    } while (i < len);
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
    if (payout > 0) {
      IERC20(target).transfer(to, payout);
    }
  }
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address staker, uint256 amount) internal {
    IERC20(target).transferFrom(staker, address(this), amount);
  }
  struct HsiStakeStartParams {
    address to;
    uint80 amount;
    uint16 newStakedDays;
  }
  /**
   * stake a given number of tokens for n days with an hsi as the underlying
   */
  function hsiStakeStart(
    HsiStakeStartParams[] calldata params,
    uint256 limit
  ) external returns(address[] memory hsis) {
    return _hsiStakeStartFor(params, limit);
  }
  function _hsiStakeStartFor(
    HsiStakeStartParams[] calldata params,
    uint256 limit
  ) internal returns (address[] memory) {
    uint256 i;
    uint256 len = params.length;
    address hsiAddress;
    uint256 total;
    uint256 amount;
    address[] memory hsis = new address[](len);
    _depositTokenFrom(msg.sender, total);
    do {
      HsiStakeStartParams calldata param = params[i];
      amount = param.amount;
      // if amount requested does not exist, then this will fail
      hsiAddress = IHedron(hedron).hexStakeStart(amount, param.newStakedDays);
      total += amount;
      hsiToOwner[hsiAddress] = param.to;
      hsis[i] = hsiAddress;
      ++i;
    } while(i < len);
    // if there is a mismatch between the amount consumed
    // and the amount transferred, then fail
    if (total != limit) {
      revert NotEnoughFunding(total, limit);
    }
    return hsis;
  }
}