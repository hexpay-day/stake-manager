// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { ERC721 } from "solmate/src/tokens/ERC721.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { Hedron } from "./interfaces/Hedron.sol";
import { HEXStakeInstanceManager } from "./interfaces/HEXStakeInstanceManager.sol";
import { IUnderlyingStakeable } from "./interfaces/IUnderlyingStakeable.sol";
import { StakeEnder } from "./StakeEnder.sol";

contract HSIStakeManager is StakeEnder {
  /**
   * a mapping of hsi addresses to the address that deposited the hsi into this contract
   */
  uint256 private constant DEFAULT_SETTINGS
    = 0x000000000000000000000000000000000000000000000000000000000000000d;
  /**
   * returns the default settings for a contract layer
   */
  function _defaultSettings() internal virtual override pure returns(uint256) {
    return DEFAULT_SETTINGS;
  }
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId, uint256 encodedSettings) external payable returns(address hsiAddress) {
    address owner = _deposit721({
      token: HSIM,
      tokenId: tokenId
    });
    uint256 index = _hsiCount({
      staker: address(this)
    });
    hsiAddress = HEXStakeInstanceManager(HSIM).hexStakeDetokenize(tokenId);
    uint256 stakeId = uint256(uint160(hsiAddress));
    // erc721 is burned - no owner - only hsi address remains
    stakeIdInfo[stakeId] = _encodeInfo({
      index: index,
      owner: owner
    });
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: encodedSettings
    });
  }
  /**
   * deposit a tokenized hsi into this contract
   * @param token the address of the token (HSIM)
   * @param tokenId the token id to deposit into this contract
   */
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = ERC721(token).ownerOf(tokenId);
    ERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  /**
   * a convenience method to retrieve a stake id from an hsi address
   * @param hsiAddress the hsi address to target
   */
  function hsiAddressToId(address hsiAddress) external view returns(uint256) {
    return _hsiAddressToId({
      hsiAddress: hsiAddress
    });
  }
  /**
   * an internal convenience method to retreive a stake id from an hsi address
   * @param hsiAddress the hsi address to target
   */
  function _hsiAddressToId(address hsiAddress) internal view returns(uint256) {
    return _getStake({
      custodian: hsiAddress,
      index: ZERO
    }).stakeId;
  }
  /**
   * withdraw an hsi from this contract's custody
   * @param hsiAddress the hsi address to withdraw from this contract
   * @dev caller must be logged as owner of hsi
   */
  function withdrawHsi(address hsiAddress) external payable returns(uint256 tokenId) {
    uint256 stakeId = uint256(uint160(hsiAddress));
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    (uint256 index, address owner) = _stakeIdToInfo({
      stakeId: stakeId
    });
    stakeIdInfo[stakeId] = ZERO;
    // this will be used later to determine whether or not to send tips back to staker
    uint256 settings = stakeIdToSettings[stakeId];
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: ZERO
    });
    tokenId = _withdraw721({
      index: index,
      owner: owner,
      hsiAddress: hsiAddress
    });
    if (_hsiCount({
      staker: address(this)
    }) > index) {
      _rewriteIndex({
        index: index
      });
    }
    // because an unbounded range of tokens can exist in the tips list,
    // we send those back last
    _removeAllTips({
      stakeId: stakeId,
      settings: settings
    });
  }
  /**
   * get the hsi count of a given stake owner
   * @param staker the account to check an hsi count
   */
  function _hsiCount(address staker) internal view returns(uint256 count) {
    return HEXStakeInstanceManager(HSIM).hsiCount(staker);
  }
  /**
   * get the count of stakes owned by a contract
   * @param staker the account to check how many stakes are owned
   */
  function _getStakeCount(address staker) internal view override returns(uint256 count) {
    return _hsiCount({
      staker: staker
    });
  }
  /**
   * tokenize/mint a stake's erc721 token to transfer ownership of it
   * @param index the index of the stake to tokenize
   * @param owner the owner of the stake
   * @param hsiAddress the hsi address (contract) that the stake is being custodied by
   */
  function _withdraw721(uint256 index, address owner, address hsiAddress) internal returns(uint256 tokenId) {
    tokenId = HEXStakeInstanceManager(HSIM).hexStakeTokenize(index, hsiAddress);
    ERC721(HSIM).transferFrom(address(this), owner, tokenId);
  }
  /**
   * retrieve a stake id's (hsi address's) singular stake
   * @param stakeId the stake id or hsi address to retrieve a stake from its list
   */
  function _getStakeInfo(uint256 stakeId) internal view override returns(
    bool valid,
    address staker,
    uint256 stakeIndex,
    IUnderlyingStakeable.StakeStore memory stake
  ) {
    // we are only testing existance because the index
    // is always 0 for the custodian
    address hsiAddress = address(uint160(stakeId));
    (stakeIndex, staker) = _stakeIdToInfo(stakeId);
    if (_stakeCount({ staker: hsiAddress }) == ONE) {
      stake = _getStake({
        custodian: hsiAddress,
        index: ZERO
      });
      valid = staker != address(0);
    }
  }
  /**
   * end a hsi's stake and return the amount of
   * unattributed tokens sent to this contract
   * @param index the hsim index of the stake to end
   * @param stakeId the stake id or hsi address
   * @param hsiCountAfter the length of stakes that will exist
   * under the hsim after this end operation is complete
   */
  function _stakeEnd(
    uint256 index,
    uint256 stakeId,
    uint256 hsiCountAfter
  ) internal override returns(uint256 targetReward) {
    targetReward = HEXStakeInstanceManager(HSIM)
      .hexStakeEnd(index, address(uint160(stakeId)));
    // move around the indexes for future stake ends
    if (hsiCountAfter > index) {
      _rewriteIndex({
        index: index
      });
    }
    if (stakeIdToSettings[stakeId] > ZERO) {
      stakeIdToSettings[stakeId] = ZERO;
    }
  }
  /**
   * because indexes change quickly they should be tracked and managed so that subsequent
   * ends do not effect one another
   * @param index the index to be targeted after removing an hsi from the underlying list
   */
  function _rewriteIndex(uint256 index) internal {
    address movedHsiAddress = HEXStakeInstanceManager(HSIM)
      .hsiLists(address(this), index);
    (, address movedOwner) = _stakeIdToInfo({
      stakeId: uint256(uint160(movedHsiAddress))
    });
    stakeIdInfo[uint256(uint160(movedHsiAddress))] = _encodeInfo({
      index: index,
      owner: movedOwner
    });
  }
  /**
   * starts an hsi for the provided staker and saves its data appropriately
   * @param staker the staker that will own this stake
   * @param newStakeAmount the number of tokens to add to the newly formed stake
   * @param newStakeDays the number of days to stake said tokens for
   * @param index the index of the stake in the list of all stakes
   */
  function _stakeStartFor(
    address staker,
    uint256 newStakeAmount,
    uint256 newStakeDays,
    uint256 index
  ) internal override returns(uint256 stakeId) {
    ERC20(TARGET).approve(HSIM, newStakeAmount);
    address hsiAddress = HEXStakeInstanceManager(HSIM)
      .hexStakeStart(newStakeAmount, newStakeDays);
    stakeId = uint160(hsiAddress);
    stakeIdInfo[stakeId] = _encodeInfo({
      index: index,
      owner: staker
    });
  }
  /**
   * mint hedron from an hsi
   * @param index the index of the stake on hsim to mint
   * @param stakeId the stake id or in this case, hsi address
   */
  function _mintHedron(uint256 index, uint256 stakeId) internal override returns(uint256) {
    return Hedron(HEDRON).mintInstanced(index, address(uint160(stakeId)));
  }
  /**
   * check that this contract is the custodian of this hsi (nft was depostied and detokenized)
   * @param stakeId the stake id to check ownership over
   */
  function _checkStakeCustodian(uint256 stakeId) internal override view {
    _verifyCustodian({
      stakeId: stakeId
    });
  }
}
