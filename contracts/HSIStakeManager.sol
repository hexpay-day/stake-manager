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
  // mapping(address => uint256) public hsiToInfo;
  uint256 constant MAX_40 = type(uint40).max;
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
  function updateSettings(address hsiAddress, Settings calldata settings) external payable {
    _verifyStakeOwnership(msg.sender, uint160(hsiAddress));
    _writePreservedSettingsUpdate(uint160(hsiAddress), _encodeSettings(settings));
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
    if (uint160(hsiAddress) < MAX_40) {
      // we are unable to take on addresses that are within the uint40 range
      // because that range is already consumed by stakeIds from the hex contract
      // this is certainly an edge case, but an important one. just in case
      revert NotAllowed();
    }
    // erc721 is burned - no owner - only hsi address remains
    stakeIdInfo[uint160(hsiAddress)] = _encodeInfo(index, owner);
    if (encodedSettings == 0) {
      _setDefaultSettings(uint160(hsiAddress));
    } else {
      _logSettingsUpdate(uint160(hsiAddress), encodedSettings);
    }
  }
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  function withdrawHsi(address hsiAddress) external returns(uint256 tokenId) {
    (uint256 index, address owner) = _stakeIdToInfo(uint160(hsiAddress));
    stakeIdInfo[uint160(hsiAddress)] = 0;
    _logSettingsUpdate(uint160(hsiAddress), 0);
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
    (, address to) = _stakeIdToInfo(uint160(hsiAddress));
    address hedronAddress = hedron;
    uint256 index;
    do {
      hsiAddress = hsiAddresses[i];
      (index, currentOwner) = _stakeIdToInfo(uint160(hsiAddress));
      if (currentOwner != to) {
        if (hedronTokens > 0) {
          _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
          hedronTokens = 0;
        }
      }
      to = currentOwner;
      if (_isCapable(stakeIdToSettings[uint160(hsiAddress)], 0)) {
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
  /**
   * end multiple stakes, and mint final tokens
   * @param hsiAddresses the hsi index and address to interact with
   * @notice a fully gas optimized plan was not used for this method
   */
  function hsiStakeEndMany(address[] calldata hsiAddresses) external {
    uint256 len = hsiAddresses.length;
    uint256 i;
    address hsiAddress;
    uint256 index;
    address currentOwner;
    do {
      hsiAddress = hsiAddresses[i];
      (index, currentOwner) = _stakeIdToInfo(uint160(hsiAddress));
      IStakeable.StakeStore memory stake = IHEX(target).stakeLists(hsiAddress, 0);
      if (stake.stakeId == 0) {
        unchecked {
          ++i;
        }
        continue;
      }
      uint256 setting = stakeIdToSettings[uint160(hsiAddress)];
      if (_isEarlyEnding(stake.lockedDay, stake.stakedDays, _currentDay())) {
        if (!_isCapable(setting, 1)) {
          unchecked {
            ++i;
          }
          continue;
        }
      }
      if (_isCapable(setting, 5)) {
        _executeTipList(stake.stakeId, currentOwner);
      }
      uint256 method;
      if (_isCapable(setting, 2)) {
        uint256 hedronReward = IHedron(hedron).mintInstanced(index, hsiAddress);
        method = setting >> 248;
        if (method > 0) {
          uint256 hedronTip = _computeMagnitude(
            hedronReward, method, setting << 8 >> 192, hedronReward,
            stake
          );
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
        _attributeFunds(setting, 3, hedron, currentOwner, hedronReward);
      }
      uint256 targetReward = IHEXStakeInstanceManager(hsim).hexStakeEnd(index, hsiAddress);
      // remove index and settings info
      stakeIdInfo[uint160(hsiAddress)] = 0;
      stakeIdToSettings[uint160(hsiAddress)] = 0;
      // move around the indexes for future stake ends
      if (IHEXStakeInstanceManager(hsim).hsiCount(address(this)) > index) {
        address movedHsiAddress = IHEXStakeInstanceManager(hsim).hsiLists(address(this), index);
        (, address movedOwner) = _stakeIdToInfo(uint160(movedHsiAddress));
        stakeIdInfo[uint160(movedHsiAddress)] = _encodeInfo(index, movedOwner);
      }
      method = setting << 72 >> 248;
      if (method > 0) {
        uint256 targetTip = _computeMagnitude(
          targetReward, method, setting << 80 >> 192, targetReward,
          stake
        );
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
      unchecked {
        ++i;
      }
    } while (i < len);
  }
}
