// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { StakeInfo } from "./StakeInfo.sol";

abstract contract EncodableSettings is StakeInfo {
  // the index of the first bit of targeted information
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT8 = uint8(SLOTS - EIGHT); // 256-8=248
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT16 = uint8(SLOTS - SIXTEEN); // 256-16=240
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT64 = uint8(SLOTS - SIXTY_FOUR); // 256-64=192
  uint8 internal constant INDEX_RIGHT_HEDRON_TIP = uint8(SLOTS - 72); // 256-72=184
  uint8 internal constant INDEX_RIGHT_TARGET_TIP = INDEX_RIGHT_HEDRON_TIP - 72; // 184-72=112
  uint8 internal constant INDEX_LEFT_TARGET_TIP = uint8(SLOTS - 144); // 256-144=112
  uint8 internal constant INDEX_RIGHT_NEW_STAKE = INDEX_RIGHT_TARGET_TIP - 72;
  uint8 internal constant INDEX_LEFT_NEW_STAKE = uint8(SLOTS - INDEX_RIGHT_NEW_STAKE);
  uint8 internal constant INDEX_RIGHT_NEW_STAKE_DAYS_METHOD = THIRTY_TWO;
  uint8 internal constant INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE = SIXTEEN;
  uint8 internal constant INDEX_RIGHT_COPY_ITERATIONS = 9;
  uint8 internal constant INDEX_RIGHT_HAS_EXTERNAL_TIPS = EIGHT;
  uint8 internal constant INDEX_RIGHT_MINT_COMMUNIS_AT_END = 7;
  uint8 internal constant INDEX_RIGHT_COPY_EXTERNAL_TIPS = 6;
  uint8 internal constant INDEX_RIGHT_STAKE_IS_TRANSFERABLE = 5;
  uint8 internal constant INDEX_LEFT_STAKE_IS_TRANSFERABLE = uint8(SLOTS - INDEX_RIGHT_STAKE_IS_TRANSFERABLE);
  uint8 internal constant INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER = FOUR;
  uint8 internal constant INDEX_RIGHT_CAN_MINT_HEDRON_AT_END = THREE;
  uint8 internal constant INDEX_RIGHT_CAN_MINT_HEDRON = TWO;
  uint8 internal constant INDEX_RIGHT_CAN_EARLY_STAKE_END = ONE;
  uint8 internal constant INDEX_RIGHT_CAN_STAKE_END = ZERO;

  mapping(uint256 stakeId => uint256 settings) public stakeIdToSettings;
  /**
   * an event to signal that settings to direct funds
   * at the end of a stake have been updated
   * @param stakeId the stake id that was updated
   * @param settings the newly updated settings
   */
  event UpdateSettings(uint256 indexed stakeId, uint256 settings);
  /**
   * the default settings for native stakes
   * stake ends are allowed
   * infinite repeats are set (254 - fe)
   * repeat original stake's number of days
   * use all available tokens during restake
   */
  uint256 private constant DEFAULT_SETTINGS
    = uint256(0x000000000000000000000000000000000000000000000000000002020000fe01);
  /**
   * @return the default encoded settings used by end stakers to tip and end stakes
   */
  function defaultSettings() external pure returns(uint256) {
    return _defaultSettings();
  }
  /** returns the default settings number provided by this contract level */
  function _defaultSettings() internal virtual pure returns(uint256) {
    return DEFAULT_SETTINGS;
  }
  /**
   * update a stake's settings by providing a new, encoded value
   * @param stakeId the stake id to update settings for
   * @param settings the settings value to update settings for
   */
  function updateSettings(uint256 stakeId, uint256 settings) external virtual payable {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    _logPreservedSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  /**
   * updates a stake id's settings
   * @param stakeId the stake id to update settings for
   * @param settings the settings to update against a provided stakeId.
   * 7th index will be ignored as it is controlled by the contract
   */
  function _logPreservedSettingsUpdate(
    uint256 stakeId,
    uint256 settings
  ) internal {
    // preserve the 7th index which contract controls
    unchecked {
      _logSettingsUpdate({
        stakeId: stakeId,
        settings: (
          (settings >> INDEX_RIGHT_COPY_ITERATIONS << INDEX_RIGHT_COPY_ITERATIONS)
          | uint8(stakeIdToSettings[stakeId] >> INDEX_RIGHT_HAS_EXTERNAL_TIPS << INDEX_RIGHT_HAS_EXTERNAL_TIPS)
          | uint256(uint8(settings)) // consent abilities
        )
      });
    }
  }
  /**
   * update the settings for a stake id
   * @param stakeId the stake id to update settings for
   * @param settings an object that holds settings values
   * to inform end stakers how to handle the stake
   */
  function _logSettingsUpdate(
    uint256 stakeId,
    uint256 settings
  ) internal {
    stakeIdToSettings[stakeId] = settings;
    emit UpdateSettings({
      stakeId: stakeId,
      settings: settings
    });
  }
  /**
   * modify the second byteword from the right to appropriately decrement
   * the number of times that these settings should be copied
   * @param settings the settings to start with - only the 2nd byte from the right is modified
   */
  function decrementCopyIterations(uint256 settings) external pure returns(uint256) {
    return _decrementCopyIterations({
      settings: settings
    });
  }
  /**
   * decrement the 2nd byte from the right if the value is < 255
   * @param settings the settings to start with - only the 2nd byte from the right is modified
   * @return updated encoded settings with appropriately decremented value
   */
  function _decrementCopyIterations(uint256 settings) internal pure returns(uint256) {
    unchecked {
      uint256 copyIterations = uint8(settings >> INDEX_RIGHT_COPY_ITERATIONS);
      if (copyIterations == ZERO) {
        return uint8(settings);
      }
      // allow settings to perist indefinitely
      if (copyIterations == MAX_UINT_7) {
        return settings;
      }
      --copyIterations;
      return (
        (settings >> INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE << INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE)
        | (copyIterations << INDEX_RIGHT_COPY_ITERATIONS) // this is 9. index 8 is left blank to erase tips
        | uint8(settings)
      );
    }
  }
}
