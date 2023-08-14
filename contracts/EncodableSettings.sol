// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./StakeInfo.sol";

abstract contract EncodableSettings is StakeInfo {
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
    uint8 newStakeMethod; // being non zero signals approval
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
  function _setDefaultSettings(uint256 stakeId) internal virtual {
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: DEFAULT_ENCODED_SETTINGS
    });
  }
  function stakeIdSettings(uint256 stakeId) external view returns(Settings memory) {
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
      hasExternalTips: (abilities >> 7) % 2 == 1,
      copyExternalTips: (abilities >> 6) % 2 == 1,
      stakeIsTransferrable: (abilities >> 5) % 2 == 1,
      shouldSendTokensToStaker: (abilities >> 4) % 2 == 1,
      canMintHedronAtEnd: (abilities >> 3) % 2 == 1,
      canMintHedron: (abilities >> 2) % 2 == 1,
      canEarlyStakeEnd: (abilities >> 1) % 2 == 1,
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
    _writePreservedSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  function _writePreservedSettingsUpdate(
    uint256 stakeId,
    uint256 settings
  ) internal {
    // preserve the 7th index which contract controls
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: (settings >> 8 << 8) | (uint8(stakeIdToSettings[stakeId]) >> 7 << 7) | (uint8(settings) << 1 >> 1)
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
  function idToDecodedSettings(uint256 stakeId) external view returns (Settings memory) {
    return _decodeSettings({
      encoded: stakeIdToSettings[stakeId]
    });
  }
  /**
   * read a single property from encoded settings
   * @notice most useful for other contracts to pull out one property without
   * needing logic for parsing
   * @param settings the settings number to read one property from
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
    return settings << fromEnd >> (256 - length);
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
    return uint256(settings.hedronTipMethod) << 248
      | uint256(settings.hedronTipMagnitude) << 184
      | uint256(settings.tipMethod) << 176
      | uint256(settings.tipMagnitude) << 112
      | uint256(settings.newStakeMethod) << 104
      | uint256(settings.newStakeMagnitude) << 40
      | uint256(settings.newStakeDaysMethod) << 32
      | uint256(settings.newStakeDaysMagnitude) << 16
      | uint256(settings.copyIterations) << 8
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
      uint8( encoded >> 248),
      uint64(encoded >> 184),
      uint8( encoded >> 176),
      uint64(encoded >> 112),
      uint8( encoded >> 104),
      uint64(encoded >> 40),
      uint8( encoded >> 32),
      uint16(encoded >> 16),
      uint8( encoded >> 8),
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
      (consentAbilities.hasExternalTips ? 1 : 0) << 7 |
      (consentAbilities.copyExternalTips ? 1 : 0) << 6 |
      (consentAbilities.stakeIsTransferrable ? 1 : 0) << 5 |
      (consentAbilities.shouldSendTokensToStaker ? 1 : 0) << 4 |
      (consentAbilities.canMintHedronAtEnd ? 1 : 0) << 3 |
      (consentAbilities.canMintHedron ? 1 : 0) << 2 |
      (consentAbilities.canEarlyStakeEnd ? 1 : 0) << 1 |
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
  function _decrementCopyIterations(uint256 setting) internal pure returns(uint256) {
    uint256 copyIterations = uint8(setting >> 8);
    if (copyIterations == 0) {
      return uint8(setting);
    }
    if (copyIterations == 255) {
      return setting;
    }
    --copyIterations;
    return (setting >> 16 << 16) | (copyIterations << 8) | uint8(setting);
  }
  /**
   * exposes the default settings to external
   */
  function defaultSettings() external virtual pure returns(Settings memory) {
    return _defaultSettings();
  }
}
