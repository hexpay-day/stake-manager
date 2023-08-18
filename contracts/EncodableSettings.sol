// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import "./StakeInfo.sol";

abstract contract EncodableSettings is StakeInfo {
  // the index of the first bit of targeted information
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT8 = 248;
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT16 = 240;
  uint8 internal constant UNUSED_SPACE_RIGHT_UINT64 = 192;
  uint8 internal constant INDEX_HEDRON_TIP_METHOD = 248;
  uint8 internal constant INDEX_HEDRON_TIP_MAGNITUDE = 184;
  uint8 internal constant UNUSED_SPACE_HEDRON_TIP_MAGNITUDE = 8;
  uint8 internal constant INDEX_TIP_METHOD = 176;
  uint8 internal constant UNUSED_SPACE_TIP_METHOD = 72;
  uint8 internal constant INDEX_TIP_MAGNITUDE = 112;
  uint8 internal constant INDEX_NEW_STAKE_METHOD = 104;
  uint8 internal constant UNUSED_SPACE_NEW_STAKE_METHOD = 144;
  uint8 internal constant INDEX_NEW_STAKE_MAGNITUDE = 40;
  uint8 internal constant INDEX_NEW_STAKE_DAYS_METHOD = 32;
  uint8 internal constant UNUSED_SPACE_NEW_STAKE_DAYS_METHOD = 216;
  uint8 internal constant INDEX_NEW_STAKE_DAYS_MAGNITUDE = 16;
  uint8 internal constant UNUSED_SPACE_NEW_STAKE_DAYS_MAGNITUDE = 224;
  uint8 internal constant INDEX_COPY_ITERATIONS = 8;
  uint8 internal constant INDEX_HAS_EXTERNAL_TIPS = 7;
  uint8 internal constant INDEX_COPY_EXTERNAL_TIPS = 6;
  uint8 internal constant INDEX_STAKE_IS_TRANSFERRABLE = 5;
  uint8 internal constant UNUSED_SPACE_STAKE_IS_TRANSFERRABLE = 251;
  uint8 internal constant INDEX_SHOULD_SEND_TOKENS_TO_STAKER = 4;
  uint8 internal constant INDEX_CAN_MINT_HEDRON_AT_END = 3;
  uint8 internal constant INDEX_CAN_MINT_HEDRON = 2;
  uint8 internal constant INDEX_CAN_EARLY_STAKE_END = 1;

  struct ConsentAbilities {
    bool canStakeEnd;
    bool canEarlyStakeEnd;
    bool canMintHedron;
    bool canMintHedronAtEnd;
    bool shouldSendTokensToStaker;
    bool stakeIsTransferrable;
    bool copyExternalTips;
    bool hasExternalTips;
  }
  // 1 word;
  struct Settings {
    uint8 hedronTipMethod;
    uint64 hedronTipMagnitude;
    // starts with full amount of end stake
    uint8 tipMethod;
    uint64 tipMagnitude;
    // the rest goes into a new stake if the number of days are set
    uint8 newStakeMethod; // being non 0 signals approval
    uint64 newStakeMagnitude;
    // useful to use methods 6+7 for stake days
    uint8 newStakeDaysMethod;
    uint16 newStakeDaysMagnitude;
    uint8 copyIterations; // 0 for do not restart, 1-254 as countdown, 255 as restart indefinitely
    /**
     * 00000001(0): can stake end
     * 00000010(1): can early stake end
     * 00000100(2): can mint hedron (any time)
     * 00001000(3): can mint hedron during end stake - future should be 0
     * 00010000(4): should send tokens to staker
     * 00100000(5): stake is transferrable
     * 01000000(6): copy external tips to next stake
     * 10000000(7): has external tips (contract controlled)
     */
    ConsentAbilities consentAbilities;
  }
  mapping(uint256 => uint256) public stakeIdToSettings;
  /**
   * an event to signal that settings to direct funds
   * at the end of a stake have been updated
   * @param stakeId the stake id that was updated
   * @param settings the newly updated settings
   */
  event UpdateSettings(uint256 indexed stakeId, uint256 settings);
  uint256 private constant DEFAULT_ENCODED_SETTINGS
    = uint256(0x000000000000000000000000000000000000040000000100000001020000ff01);
  function defaultEncodedSettings() external virtual pure returns(uint256) {
    return DEFAULT_ENCODED_SETTINGS;
  }
  function stakeIdSettings(uint256 stakeId) external view returns (Settings memory) {
    return _decodeSettings({
      encoded: stakeIdToSettings[stakeId]
    });
  }
  function decodeConsentAbilities(uint256 abilities) external pure returns(ConsentAbilities memory) {
    return _decodeConsentAbilities({
      abilities: abilities
    });
  }
  function _decodeConsentAbilities(uint256 abilities) internal pure returns(ConsentAbilities memory) {
    return ConsentAbilities({
      hasExternalTips: (abilities >> INDEX_HAS_EXTERNAL_TIPS) % 2 == 1,
      copyExternalTips: (abilities >> INDEX_COPY_EXTERNAL_TIPS) % 2 == 1,
      stakeIsTransferrable: (abilities >> INDEX_STAKE_IS_TRANSFERRABLE) % 2 == 1,
      shouldSendTokensToStaker: (abilities >> INDEX_SHOULD_SEND_TOKENS_TO_STAKER) % 2 == 1,
      canMintHedronAtEnd: (abilities >> INDEX_CAN_MINT_HEDRON_AT_END) % 2 == 1,
      canMintHedron: (abilities >> INDEX_CAN_MINT_HEDRON) % 2 == 1,
      canEarlyStakeEnd: (abilities >> INDEX_CAN_EARLY_STAKE_END) % 2 == 1,
      canStakeEnd: abilities % 2 == 1
    });
  }
  /**
   * updates settings under a stake id to the provided settings struct
   * @param stakeId the stake id to update
   * @param settings the settings to update the stake id to
   */
  function updateSettings(uint256 stakeId, Settings calldata settings) external virtual payable {
    _updateEncodedSettings({
      stakeId: stakeId,
      settings: _encodeSettings(settings)
    });
  }
  function updateSettingsEncoded(uint256 stakeId, uint256 settings) external virtual payable {
    _updateEncodedSettings({
      stakeId: stakeId,
      settings: settings
    });
  }
  function _updateEncodedSettings(uint256 stakeId, uint256 settings) internal {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    _logPreservedSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  function _logPreservedSettingsUpdate(
    uint256 stakeId,
    uint256 settings
  ) internal {
    // preserve the 7th index which contract controls
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: (
        (settings >> INDEX_COPY_ITERATIONS << INDEX_COPY_ITERATIONS)
        | (uint8(stakeIdToSettings[stakeId]) >> INDEX_HAS_EXTERNAL_TIPS << INDEX_HAS_EXTERNAL_TIPS)
        | (uint8(settings) << 1 >> 1)
      )
    });
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
   * read a single property from encoded settings
   * @notice most useful for other contracts to pull out 1 property without
   * needing logic for parsing
   * @param settings the settings number to read 1 property from
   * @param fromEnd the index from the end to start at
   * @param length the number of bits to read
   */
  function readEncodedSettings(
    uint256 settings,
    uint256 fromEnd,
    uint256 length
  ) external pure returns(uint256) {
    return _readEncodedSettings({
      settings: settings,
      fromEnd: fromEnd,
      length: length
    });
  }
  function _readEncodedSettings(
    uint256 settings,
    uint256 fromEnd,
    uint256 length
  ) internal pure returns(uint256) {
    return settings << fromEnd >> (SLOTS - length);
  }
  /**
   * encode a settings struct into it's number
   * @param settings the settings struct to be encoded into a number
   */
  function encodeSettings(Settings memory settings) external pure returns(uint256 encoded) {
    return _encodeSettings({
      settings: settings
    });
  }
  function _encodeSettings(Settings memory settings) internal pure returns(uint256 encoded) {
    return uint256(settings.hedronTipMethod) << INDEX_HEDRON_TIP_METHOD
      | uint256(settings.hedronTipMagnitude) << INDEX_HEDRON_TIP_MAGNITUDE
      | uint256(settings.tipMethod) << INDEX_TIP_METHOD
      | uint256(settings.tipMagnitude) << INDEX_TIP_MAGNITUDE
      | uint256(settings.newStakeMethod) << INDEX_NEW_STAKE_METHOD
      | uint256(settings.newStakeMagnitude) << INDEX_NEW_STAKE_MAGNITUDE
      | uint256(settings.newStakeDaysMethod) << INDEX_NEW_STAKE_DAYS_METHOD
      | uint256(settings.newStakeDaysMagnitude) << INDEX_NEW_STAKE_DAYS_MAGNITUDE
      | uint256(settings.copyIterations) << INDEX_COPY_ITERATIONS
      | uint256(_encodeConsentAbilities(settings.consentAbilities));
  }
  /**
   * decode an encoded setting into it's settings struct
   * @param encoded the encoded setting to decode
   * @return settings the decoded settings struct
   */
  function decodeSettings(uint256 encoded) external pure returns(Settings memory settings) {
    return _decodeSettings({
      encoded: encoded
    });
  }
  function _decodeSettings(uint256 encoded) internal pure returns(Settings memory settings) {
    return Settings(
      uint8( encoded >> INDEX_HEDRON_TIP_METHOD),
      uint64(encoded >> INDEX_HEDRON_TIP_MAGNITUDE),
      uint8( encoded >> INDEX_TIP_METHOD),
      uint64(encoded >> INDEX_TIP_MAGNITUDE),
      uint8( encoded >> INDEX_NEW_STAKE_METHOD),
      uint64(encoded >> INDEX_NEW_STAKE_MAGNITUDE),
      uint8( encoded >> INDEX_NEW_STAKE_DAYS_METHOD),
      uint16(encoded >> INDEX_NEW_STAKE_DAYS_MAGNITUDE),
      uint8( encoded >> INDEX_COPY_ITERATIONS),
      _decodeConsentAbilities({
        abilities: uint8(encoded)
      })
    );
  }
  function encodeConsentAbilities(ConsentAbilities calldata consentAbilities) external pure returns(uint256) {
    return _encodeConsentAbilities({
      consentAbilities: consentAbilities
    });
  }
  function _encodeConsentAbilities(ConsentAbilities memory consentAbilities) internal pure returns(uint256) {
    return (
      (consentAbilities.hasExternalTips ? 1 : 0) << INDEX_HAS_EXTERNAL_TIPS |
      (consentAbilities.copyExternalTips ? 1 : 0) << INDEX_COPY_EXTERNAL_TIPS |
      (consentAbilities.stakeIsTransferrable ? 1 : 0) << INDEX_STAKE_IS_TRANSFERRABLE |
      (consentAbilities.shouldSendTokensToStaker ? 1 : 0) << INDEX_SHOULD_SEND_TOKENS_TO_STAKER |
      (consentAbilities.canMintHedronAtEnd ? 1 : 0) << INDEX_CAN_MINT_HEDRON_AT_END |
      (consentAbilities.canMintHedron ? 1 : 0) << INDEX_CAN_MINT_HEDRON |
      (consentAbilities.canEarlyStakeEnd ? 1 : 0) << INDEX_CAN_EARLY_STAKE_END |
      (consentAbilities.canStakeEnd ? 1 : 0)
    );
  }
  function _defaultSettings() internal virtual pure returns(Settings memory settings) {
    // 0x00000000000000000000000000000000000000000000040000000100000001020000ff01
    return Settings(
      /*
       * by default, there is no hedron tip
       * assume that stakers will manage their own stakes at bare minimum
       */
      uint8(0), uint64(0), // hedron tip
      /*
       * by default, there is no tip
       * assume that stakers will manage their own stakes at bare minimum
       */
      uint8(0), uint64(0), // tip
      /*
       * by default, assume that all tokens minted from an end stake
       * should go directly into a new stake
       */
      uint8(4), uint64((1 << 32) | 1), // new stake amount
      /*
       * by default, assume that by using this contract, users want efficiency gains
       * so by default, restarting their stakes are the most efficient means of managing tokens
       */
      uint8(2), uint16(0),
      255, // restart forever
      /*
       * by index: 00000001
       * 7: signal to ender that tips exist to be collected (allows contract to avoid an SLOAD) (0)
       * 6: should recreate external tips
       * 5: give dominion over hedron after tip to staker (0)
       * 4: give dominion over target after tip to staker (0)
       * 3: do not allow end hedron mint (0)
       * 2: do not allow continuous hedron mint (0)
       * 1: do not allow early end (0)
       * 0: allow end stake once days have been served (1)
       *
       * restarting is signalled by using settings above
       * no funds are ever pulled from external address
       * is ever allowed except by sender
       *
       * the reason why the hedron flags are 0 by default on the contract level is because
       * it may be worthwhile for hedron developers to build on top of this contract
       * and it is poor form to force people in the future to have to cancel out the past
       * front ends may choose to send a different default (non 0) during stake start
       */
      ConsentAbilities({
        canStakeEnd: true,
        canEarlyStakeEnd: false,
        canMintHedron: false,
        canMintHedronAtEnd: false,
        shouldSendTokensToStaker: false,
        stakeIsTransferrable: false,
        copyExternalTips: false,
        hasExternalTips: false
      })
    );
  }
  function decrementCopyIterations(uint256 settings) external pure returns(uint256) {
    return _decrementCopyIterations(settings);
  }
  function _decrementCopyIterations(uint256 setting) internal pure returns(uint256) {
    uint256 copyIterations = uint8(setting >> INDEX_COPY_ITERATIONS);
    if (copyIterations == 0) {
      return uint8(setting);
    }
    if (copyIterations == MAX_UINT8) {
      return setting;
    }
    --copyIterations;
    return (
      (setting >> INDEX_NEW_STAKE_DAYS_MAGNITUDE << INDEX_NEW_STAKE_DAYS_MAGNITUDE)
      | (copyIterations << INDEX_COPY_ITERATIONS)
      | uint8(setting)
    );
  }
  /**
   * exposes the default settings to external
   */
  function defaultSettings() external virtual pure returns(Settings memory) {
    return _defaultSettings();
  }
}
