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
  event UpdateSettings(address indexed hsi, uint256 indexed settings);
  uint256 private constant DEFAULT_ENCODED_SETTINGS
    = 0x0000000000000000000000000000000000000000000000000000000000000005;
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
   * update settings for a stake id
   * @param stakeId the stake id to update
   * @param settings the settings struct to update
   * @dev only available to the owner
   * @notice this method will fail if the stake is not found
   * do not chain this method with other methods that could fail such as end stakes
   */
  function updateSettings(uint256 stakeId, Settings calldata settings) external override payable {
    _verifyStakeOwnership(msg.sender, stakeId);
    _writePreservedSettingsUpdate(stakeId, _encodeSettings(settings));
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
    uint256 stakeId = _hsiAddressToId(hsiAddress);
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
    uint256 stakeId = _hsiAddressToId(hsiAddress);
    (uint256 index, address owner) = _stakeIdToInfo(stakeId);
    if (msg.sender != owner) {
      revert StakeNotOwned(msg.sender, owner);
    }
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
  /**
   * mint rewards and transfer them the owner of each hsi
   * @param hsiAddresses variable params for each call
   * @notice any combination of owners can be passed,
   * however, it is most efficient to order the hsi address by owner
   */
  function mintRewards(address[] calldata hsiAddresses) external {
    uint256 len = hsiAddresses.length;
    uint256 i;
    uint256 hedronTokens;
    address hsiAddress = hsiAddresses[0];
    address currentOwner;
    uint256 stakeId;
    (, address to) = _stakeIdToInfo(_hsiAddressToId(hsiAddress));
    address hedronAddress = hedron;
    uint256 index;
    do {
      hsiAddress = hsiAddresses[i];
      stakeId = _hsiAddressToId(hsiAddress);
      (index, currentOwner) = _stakeIdToInfo(stakeId);
      if (currentOwner != to) {
        if (hedronTokens > 0) {
          _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
          hedronTokens = 0;
        }
      }
      to = currentOwner;
      if (_isCapable(stakeIdToSettings[stakeId], 0)) {
        hedronTokens += IHedron(hedron).mintInstanced(index, hsiAddress);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
    }
  }
  function hsiStakeEndMany(address[] calldata hsiAddresses) external {
    uint256 len = hsiAddresses.length;
    uint256 i;
    do {
      _stakeEndByConsent(uint160(hsiAddresses[i]));
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
    uint256 stakeId
  ) internal override returns(uint256 targetReward) {
    targetReward = IHEXStakeInstanceManager(hsim)
      .hexStakeEnd(index, address(uint160(stakeId)));
    // move around the indexes for future stake ends
    if (IHEXStakeInstanceManager(hsim).hsiCount(address(this)) > index) {
      address movedHsiAddress = IHEXStakeInstanceManager(hsim)
        .hsiLists(address(this), index);
      uint256 movedStakeId = _hsiAddressToId(movedHsiAddress);
      (, address movedOwner) = _stakeIdToInfo(movedStakeId);
      stakeIdInfo[movedStakeId] = _encodeInfo(index, movedOwner);
    }
    stakeIdInfo[stakeId] = 0;
  }
  function _stakeStartFor(
    address staker,
    uint256 newStakeAmount,
    uint256 newStakeDays
  ) internal override returns(uint256 stakeId) {
    uint256 index = IHEXStakeInstanceManager(hsim).hsiCount(address(this));
    address hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeStart(newStakeAmount, newStakeDays);
    stakeId = uint160(hsiAddress);
    stakeIdInfo[stakeId] = _encodeInfo(index, staker);
  }
  // /**
  //  * end multiple stakes, and mint final tokens
  //  * @param hsiAddresses the hsi index and address to interact with
  //  */
  // function hsiStakeEndMany(address[] calldata hsiAddresses) external {
  //   uint256 len = hsiAddresses.length;
  //   uint256 i;
  //   address hsiAddress;
  //   uint256 stakeId;
  //   uint256 index;
  //   address currentOwner;
  //   uint256 today = _currentDay();
  //   do {
  //     hsiAddress = hsiAddresses[i];
  //     IStakeable.StakeStore memory stake = IHEX(target).stakeLists(hsiAddress, 0);
  //     stakeId = stake.stakeId;
  //     if (stakeId == 0) {
  //       unchecked {
  //         ++i;
  //       }
  //       continue;
  //     }
  //     (index, currentOwner) = _stakeIdToInfo(stakeId);
  //     uint256 setting = stakeIdToSettings[stakeId];
  //     if (_isEarlyEnding(stake.lockedDay, stake.stakedDays, today)) {
  //       if (!_isCapable(setting, 1)) {
  //         unchecked {
  //           ++i;
  //         }
  //         continue;
  //       }
  //     }
  //     if (_isCapable(setting, 7)) {
  //       _executeTipList(stakeId, currentOwner, 0);
  //     }
  //     uint256 method;
  //     if (_isCapable(setting, 2)) {
  //       uint256 hedronReward = _mintInstancedHedron(index, hsiAddress);
  //       method = setting >> 248;
  //       if (method > 0) {
  //         uint256 hedronTip = _computeMagnitude(
  //           hedronReward, method, setting << 8 >> 192, hedronReward,
  //           stake
  //         );
  //         if (hedronTip > 0) {
  //           hedronReward = _checkAndExecTip(
  //             stake.stakeId,
  //             currentOwner,
  //             hedron,
  //             hedronTip,
  //             hedronReward
  //           );
  //         }
  //       }
  //       _attributeFunds(setting, 3, hedron, currentOwner, hedronReward);
  //     }
  //     uint256 targetReward = IHEXStakeInstanceManager(hsim).hexStakeEnd(index, hsiAddress);
  //     // move around the indexes for future stake ends
  //     if (IHEXStakeInstanceManager(hsim).hsiCount(address(this)) > index) {
  //       address movedHsiAddress = IHEXStakeInstanceManager(hsim).hsiLists(address(this), index);
  //       uint256 movedStakeId = _hsiAddressToId(movedHsiAddress);
  //       (, address movedOwner) = _stakeIdToInfo(movedStakeId);
  //       stakeIdInfo[movedStakeId] = _encodeInfo(index, movedOwner);
  //     }
  //     method = setting << 72 >> 248;
  //     if (method > 0) {
  //       uint256 targetTip = _computeMagnitude(
  //         targetReward, method, setting << 80 >> 192, targetReward,
  //         stake
  //       );
  //       if (targetTip > 0) {
  //         targetReward = _checkAndExecTip(
  //           stake.stakeId,
  //           currentOwner,
  //           target,
  //           targetTip,
  //           targetReward
  //         );
  //       }
  //     }
  //     // remove index and settings info
  //     stakeIdInfo[stakeId] = 0;
  //     stakeIdToSettings[stakeId] = 0;
  //     // attribute funds to originating staker
  //     _attributeFunds(setting, 4, target, currentOwner, targetReward);
  //     unchecked {
  //       ++i;
  //     }
  //   } while (i < len);
  // }
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
