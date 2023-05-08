// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "./ConsentualStakeManager.sol";
import "./IPublicEndStakeable.sol";
import "./IHedron.sol";
import "./StakeEnder.sol";

contract GroupedStakeManager {
  /**
   * @notice error is thrown when there is not enough funding to do the required operation
   */
  error NotEnoughFunding(uint256 provided, uint256 expected);
  error NotAllowed();
  mapping(address => bool) public publicWhitelist;
  mapping(address => address) public stakeEnder;
  mapping(address => mapping(uint256 => address)) public tokenOwner;
  mapping(address => address) public hsiToOwner;
  constructor() {
    publicWhitelist[0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b] = true; // maxi
    publicWhitelist[0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6] = true; // deci
    publicWhitelist[0x6B0956258fF7bd7645aa35369B55B61b8e6d6140] = true; // lucky
    publicWhitelist[0xF55cD1e399e1cc3D95303048897a680be3313308] = true; // trio
    publicWhitelist[0xe9f84d418B008888A992Ff8c6D22389C2C3504e0] = true; // base
  }
  function endPublicStake(address target, uint256 stakeId) external {
    if (!publicWhitelist[target]) {
      return;
    }
    StakeEnder(_createEndStaker(msg.sender)).stakeEnd(target, stakeId);
  }
  function createEndStaker(address owner) external returns(address) {
    return _createEndStaker(owner);
  }
  function _createEndStaker(address owner) internal returns(address stakeEnderAddress) {
    stakeEnderAddress = stakeEnder[owner];
    if (stakeEnderAddress != address(0)) {
      return stakeEnderAddress;
    }
    stakeEnderAddress = address(new StakeEnder{salt: keccak256(abi.encode(owner))}(owner));
    stakeEnder[owner] = stakeEnderAddress;
  }
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId) external {
    address hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
    address hsim = IHedron(hedron).hsim();
    _deposit721(hsim, tokenId);
  }
  function withdrawHsiTo(address to, uint256 tokenId) external {
    address hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
    address hsim = IHedron(hedron).hsim();
    _withdraw721(hsim, to, tokenId);
  }
  function depositWaatsa(uint256 tokenId) external {
    address waatsa = 0x2520E62474bA3085693f856B3E93fa6C92a4EF48;
    _deposit721(waatsa, tokenId);
  }
  function withdrawWaatsa(address to, uint256 tokenId) external {
    address waatsa = 0x2520E62474bA3085693f856B3E93fa6C92a4EF48;
    _withdraw721(waatsa, to, tokenId);
  }
  function _deposit721(address token, uint256 tokenId) internal {
    address owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
    // stake manager is now the owner of the token id
    tokenOwner[token][tokenId] = owner;
  }
  function _withdraw721(address token, address to, uint256 tokenId) internal {
    if (msg.sender != tokenOwner[token][tokenId]) {
      revert NotAllowed();
    }
    delete tokenOwner[token][tokenId];
    IERC721(token).transferFrom(address(this), to, tokenId);
  }
  struct RewardParams {
    address token;
    bytes32 a;
    bytes32 b;
    bytes32 c;
  }
  function mintRewardsTo(address to, RewardParams[] calldata params) external {
    address hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
    uint256 len = params.length;
    uint256 i;
    uint256 hedronTokens;
    do {
      RewardParams calldata param = params[i];
      if (param.token == hedron) {
        if (uint256(param.a) == 0) {
          hedronTokens += IHedron(hedron).mintNative(uint256(param.b), uint40(uint256(param.c)));
        } else {
          hedronTokens += IHedron(hedron).mintInstanced(uint256(param.b), address(uint160(uint256(param.c))));
        }
      }
      ++i;
    } while (i < len);
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
  }
  struct StakeEndParams {
    uint96 hsiIndex;
    address hsiAddress;
  }
  function hsiStakeEndMany(address to, StakeEndParams[] calldata params) external {
    address hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
    address _target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
    uint256 len = params.length;
    uint256 payout;
    uint256 i;
    do {
      payout += IHedron(hedron).hexStakeEnd(params[i].hsiIndex, params[i].hsiAddress);
      ++i;
    } while (i < len);
    if (payout > 0) {
      IERC20(_target).transfer(to, payout);
    }
  }
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address staker, uint256 amount) internal {
    IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).transferFrom(staker, address(this), amount);
  }
  struct HsiStakeStartParams {
    address to;
    uint80 amount;
    uint16 newStakedDays;
  }
  /**
   * stake a given number of tokens for n days with an hsi as the underlying
   */
  function hsiStakeStart(HsiStakeStartParams[] calldata params) external returns(address[] memory hsis) {
    uint256 limit = _sumHsiStakeStartParamsForAmount(params);
    _depositTokenFrom(msg.sender, limit);
    (, hsis) = _hsiStakeStartFor(params, limit);
  }
  function _sumHsiStakeStartParamsForAmount(
    HsiStakeStartParams[] calldata params
  ) internal pure returns(uint256 amount) {
    uint256 i;
    uint256 len = params.length;
    do {
      uint256 amt = params[i].amount;
      if (amt == 0) {
        revert NotAllowed();
      }
      amount += amt;
      ++i;
    } while(i < len);
  }
  /**
   * clamp a given amount to the maximum amount
   * use the maximum amount if no amount is requested
   * @param amount the amount requested by another function
   * @param max the limit that the value can be
   */
  function _clamp(uint256 amount, uint256 max) internal pure returns(uint256) {
    if (amount == 0) {
      return max;
    }
    return amount > max ? max : amount;
  }
  function clamp(uint256 amount, uint256 limit) external pure returns(uint256) {
    return _clamp(amount, limit);
  }
  function _hsiStakeStartFor(
    HsiStakeStartParams[] calldata params,
    uint256 limit
  ) internal returns (uint256 total, address[] memory) {
    address hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
    uint256 i;
    uint256 len = params.length;
    address hsiAddress;
    address[] memory hsis = new address[](len);
    do {
      HsiStakeStartParams calldata param = params[i];
      uint256 amount = param.amount;
      if (amount > limit) {
        revert NotEnoughFunding(amount, limit);
      }
      amount = _clamp(amount, limit);
      // if zero or near zero is passed this will fail
      hsiAddress = IHedron(hedron).hexStakeStart(amount, param.newStakedDays);
      limit -= amount;
      total += amount;
      hsiToOwner[hsiAddress] = param.to;
      hsis[i] = hsiAddress;
      ++i;
    } while(i < len);
    return (total, hsis);
  }
}
