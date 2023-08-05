// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./IHEXStakeInstanceManager.sol";
import "./IHEX.sol";
import "./Multicall.sol";
import "./StakeEnder.sol";
import "./IStakeable.sol";
import "./Tipper.sol";
import "./Magnitude.sol";

contract HSIStakeManager is StakeEnder {
  /**
   * a mapping of hsi addresses to the address that deposited the hsi into this contract
   */
  uint256 private constant DEFAULT_ENCODED_SETTINGS
    = 0x000000000000000000000000000000000000000000000000000000000000000d;
  function defaultEncodedSettings() external override pure returns(uint256) {
    return DEFAULT_ENCODED_SETTINGS;
  }
  // takes the hsi address (as stake id)
  function _setDefaultSettings(uint256 stakeId) internal override {
    _logSettingsUpdate(stakeId, DEFAULT_ENCODED_SETTINGS);
  }
  function _defaultSettings() internal override pure returns(Settings memory) {
    return _decodeSettings(DEFAULT_ENCODED_SETTINGS);
  }
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId, uint256 encodedSettings) external returns(address hsiAddress) {
    address owner = _deposit721(hsim, tokenId);
    uint256 index = IHEXStakeInstanceManager(hsim).hsiCount(address(this));
    hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeDetokenize(tokenId);
    uint256 stakeId = uint256(uint160(hsiAddress));
    // erc721 is burned - no owner - only hsi address remains
    stakeIdInfo[stakeId] = _encodeInfo(index, owner);
    if (encodedSettings == 0) {
      _setDefaultSettings(stakeId);
    } else {
      _logSettingsUpdate(stakeId, encodedSettings);
    }
  }
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  function hsiAddressToId(address hsiAddress) external view returns(uint256) {
    return _hsiAddressToId(hsiAddress);
  }
  function _hsiAddressToId(address hsiAddress) internal view returns(uint256) {
    return _getStake(hsiAddress, 0).stakeId;
  }
  function withdrawHsi(address hsiAddress) external returns(uint256 tokenId) {
    uint256 stakeId = uint256(uint160(hsiAddress));
    _verifyStakeOwnership(msg.sender, stakeId);
    (uint256 index, address owner) = _stakeIdToInfo(stakeId);
    uint256 tipCount = _stakeIdTipSize(stakeId);
    if (tipCount > 0) {
      uint256[] memory indexes = new uint256[](tipCount);
      for (uint256 i = 0; i < indexes.length; ++i) {
        indexes[i] = i;
      }
      _removeTipFromStake(stakeId, indexes);
    }
    stakeIdInfo[stakeId] = 0;
    _logSettingsUpdate(stakeId, 0);
    tokenId = _withdraw721(index, owner, hsiAddress);
  }
  function _withdraw721(uint256 index, address owner, address hsiAddress) internal returns(uint256 tokenId) {
    tokenId = IHEXStakeInstanceManager(hsim).hexStakeTokenize(index, hsiAddress);
    IERC721(hsim).transferFrom(address(this), owner, tokenId);
  }
  function hsiStakeEndMany(address[] calldata hsiAddresses) external {
    uint256 len = hsiAddresses.length;
    uint256 i;
    uint256 count = (_currentDay() << 128) | IHEXStakeInstanceManager(hsim).hsiCount(address(this));
    do {
      (, count) = _stakeEndByConsent(uint160(hsiAddresses[i]), count);
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  function _verifyStakeMatchesIndex(uint256, uint256 stakeId) internal view override returns(
    IStakeable.StakeStore memory stake
  ) {
    // we are only testing existance because we do not have
    // the underlying stake index
    address hsiAddress = address(uint160(stakeId));
    if (_hsiAddressToId(hsiAddress) > 0) {
      stake = _getStake(hsiAddress, 0);
    }
  }
  function _stakeEnd(
    uint256 index,
    uint256 stakeId,
    uint256 stakeCountAfter
  ) internal override returns(uint256 targetReward) {
    targetReward = IHEXStakeInstanceManager(hsim)
      .hexStakeEnd(index, address(uint160(stakeId)));
    // move around the indexes for future stake ends
    if (stakeCountAfter > index) {
      address movedHsiAddress = IHEXStakeInstanceManager(hsim)
        .hsiLists(address(this), index);
      // uint256 movedStakeId = _hsiAddressToId(movedHsiAddress);
      (, address movedOwner) = _stakeIdToInfo(uint256(uint160(movedHsiAddress)));
      stakeIdInfo[uint256(uint160(movedHsiAddress))] = _encodeInfo(index, movedOwner);
    }
    stakeIdInfo[stakeId] = 0;
  }
  function _stakeStartFor(
    address staker,
    uint256 newStakeAmount,
    uint256 newStakeDays,
    uint256 index
  ) internal override returns(uint256 stakeId) {
    IERC20(target).approve(hsim, newStakeAmount);
    address hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeStart(newStakeAmount, newStakeDays);
    stakeId = uint160(hsiAddress);
    stakeIdInfo[stakeId] = _encodeInfo(index, staker);
  }
  function _mintHedron(uint256 index, uint256 id) internal override returns(uint256) {
    return _mintInstancedHedron(index, address(uint160(id)));
  }
  /**
   * check that this contract is the custodian of this hsi (nft was depostied and detokenized)
   * @param stakeId the stake id to check ownership over
   */
  function _checkStakeCustodian(uint256 stakeId) internal override view {
    _verifyCustodian(stakeId);
  }
}
