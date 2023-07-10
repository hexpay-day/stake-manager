// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./IHEXStakeInstanceManager.sol";
import "./IHEX.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";
import "./IStakeable.sol";
import "./Tipper.sol";
import "./Magnitude.sol";

contract HSIStakeManager is UnderlyingStakeable, Tipper, Magnitude {
  /**
   * a mapping of hsi addresses to the address that deposited the hsi into this contract
   */
  mapping(address => address) public hsiToOwner;
  mapping(address => uint256) public settings;
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId) external {
    address hsim = IHedron(hedron).hsim();
    address owner = _deposit721(hsim, tokenId);
    address hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeDetokenize(tokenId);
    // erc721 is burned - no owner - only hsi address remains
    hsiToOwner[hsiAddress] = owner;
    settings[hsiAddress] = 0x0000000000000000000000000000000000000000000000000000000000000003;
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
    address hedronAddress = hedron;
    do {
      hsiAddress = params[i].hsiAddress;
      currentOwner = hsiToOwner[hsiAddress];
      if (currentOwner != to) {
        if (hedronTokens > 0) {
          _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
        }
        hedronTokens = 0;
      }
      to = currentOwner;
      uint256 setting = settings[hsiAddress];
      if (_isCapable(setting, 0)) {
        hedronTokens += IHedron(hedron).mintInstanced(params[i].hsiIndex, hsiAddress);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
    }
  }
  /**
   * end multiple stakes, and mint final tokens
   * @param params the hsi index and address to interact with
   */
  function hsiStakeEndMany(HSIParams[] calldata params) external {
    uint256 len = params.length;
    uint256 i;
    address hsiAddress;
    uint256 index;
    address currentOwner;
    address hsim = IHedron(hedron).hsim();
    do {
      hsiAddress = params[i].hsiAddress;
      currentOwner = hsiToOwner[hsiAddress];
      index = params[i].hsiIndex;
      IStakeable.StakeStore memory stake = IHEX(target).stakeLists(hsiAddress, 0);
      uint256 setting = settings[hsiAddress];
      if (_isCapable(setting, 6)) {
        _executeTipList(stake.stakeId, currentOwner);
      }
      uint256 hedronReward;
      if (_isCapable(setting, 1)) {
        hedronReward = IHedron(hedron).mintInstanced(index, hsiAddress);
        if (_isCapable(setting, 2)) {
          uint256 hedronTip = _checkTipAmount(setting >> 184, hedronReward, stake);
          if (hedronTip > 0) {
            hedronReward = _checkAndExecTip(
              stake.stakeId,
              currentOwner,
              hedron,
              hedronTip,
              hedronReward
            );
          }
        }
      }
      uint256 targetReward = IHEXStakeInstanceManager(hsim).hexStakeEnd(index, hsiAddress);
      if (_isCapable(setting, 3)) {
        uint256 targetTip = _checkTipAmount(setting >> 152, targetReward, stake);
        if (targetTip > 0) {
          targetReward = _checkAndExecTip(
            stake.stakeId,
            currentOwner,
            target,
            targetTip,
            targetReward
          );
        }
      }
      _attributeFunds(setting, 4, target, currentOwner, targetReward);
      _attributeFunds(setting, 5, hedron, currentOwner, hedronReward);
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  function setSettings(address hsiAddress, uint256 setting) external {
    if (hsiToOwner[hsiAddress] != msg.sender) {
      revert NotAllowed();
    }
    settings[hsiAddress] = uint224(setting);
  }
}
