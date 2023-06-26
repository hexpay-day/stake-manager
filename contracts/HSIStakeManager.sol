// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./IHEXStakeInstanceManager.sol";
import "./Multicall.sol";
import "./AuthorizationManager.sol";

contract HSIStakeManager is AuthorizationManager {
  /**
   * a mapping of hsi addresses to the address that deposited the hsi into this contract
   */
  mapping(address => address) public hsiToOwner;
  constructor() AuthorizationManager(3) {}
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId, uint256 settings) external {
    address hsim = IHedron(hedron).hsim();
    address owner = _deposit721(hsim, tokenId);
    address hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeDetokenize(tokenId);
    // erc721 is burned - no owner - only hsi address remains
    hsiToOwner[hsiAddress] = owner;
    _setAuthorization(_authorizationKey(msg.sender, hsiAddress), settings);
  }
  /**
   * check if the provided address is authorized to perform an action
   * @param runner the address that will call the contract method
   * @param hsiAddress the hsi address in question
   * @param index the index of the settings to check for a "1"
   */
  function isAuthorized(address runner, address hsiAddress, uint256 index) external view returns(bool) {
    return _isAuthorized(_authorizationKey(runner, hsiAddress), index);
  }
  /**
   * produce the key that will be used to check the "authorization" mapping
   * @param runner the address that will call the contract method
   * @param hsiAddress the hsi address in question
   */
  function authorizationKey(address runner, address hsiAddress) external pure returns (bytes32) {
    return _authorizationKey(runner, hsiAddress);
  }
  function _authorizationKey(address runner, address hsiAddress) internal pure returns (bytes32) {
    return keccak256(abi.encode(runner, hsiAddress));
  }
  /**
   * provide authorization to addresses, as the owner of the hsi
   * @param runner the address that will run methods in the future
   * @param hsiAddress the hsi address that this setting should be scoped to
   * @param setting the setting number that holds 256 flags
   */
  function setAuthorization(address runner, address hsiAddress, uint256 setting) external {
    if (hsiToOwner[hsiAddress] != msg.sender) {
      revert NotAllowed();
    }
    _setAuthorization(_authorizationKey(runner, hsiAddress), setting);
  }
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  struct HSIParams {
    uint96 hsiIndex;
    address hsiAddress;
  }
  /**
   * mint rewards and transfer them the owner of each hsi
   * @param params variable params for each call
   * @notice any combination of owners can be passed,
   * however, it is most efficient to order the hsi address by owner
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
      if (_isAuthorized(_authorizationKey(msg.sender, hsiAddress), 0)) {
        currentOwner = hsiToOwner[hsiAddress];
        if (currentOwner != to) {
          IERC20(hedron).transfer(to, hedronTokens);
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += IHedron(hedron).mintInstanced(params[i].hsiIndex, hsiAddress);
      }
      unchecked {
        ++i;
      }
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
    address hsiAddress = params[0].hsiAddress;
    uint256 index;
    address currentOwner;
    address to = hsiToOwner[hsiAddress];
    address hsim = IHedron(hedron).hsim();
    do {
      hsiAddress = params[i].hsiAddress;
      if (_isAuthorized(_authorizationKey(msg.sender, hsiAddress), 1)) {
        currentOwner = hsiToOwner[hsiAddress];
        if (currentOwner != to) {
          _payout(to, hedronTokens, targetTokens);
          hedronTokens = 0;
          targetTokens = 0;
        }
        index = params[i].hsiIndex;
        unchecked {
          hedronTokens += IHedron(hedron).mintInstanced(index, hsiAddress);
          targetTokens += IHEXStakeInstanceManager(hsim).hexStakeEnd(index, hsiAddress);
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    _payout(to, hedronTokens, targetTokens);
  }
  /**
   * transfer tokens to a given address
   * @param to send tokens to this address
   * @param hedronTokens the number of hedron tokens to send
   * @param targetTokens the number of hex tokens to send
   */
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
