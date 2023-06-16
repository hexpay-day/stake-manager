// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract EncodableSettings {
  // 1 word;
  struct Settings {
    // starts with full amount of end stake
    uint8 tipMethod;
    uint64 tipMagnitude;
    // starts with amount of end stake - tip amount
    uint8 withdrawableMethod;
    uint64 withdrawableMagnitude;
    // the rest goes into a new stake if the number of days are set
    uint8 newStakeMethod; // being non zero signals approval
    uint64 newStakeMagnitude;
    uint8 newStakeDaysMethod;
    uint16 newStakeDaysMagnitude;
    uint8 copyIterations; // 0 for do not restart, 1-254 as countdown, 255 as restart indefinitely
    uint8 consentAbilities; // 0/1 end, 00/10 early end, 100 mint hedron, 1000 mint hedron during end stake
  }
  mapping(uint256 => uint256) public idToSettings;
  /**
   * an event to signal that settings to direct funds
   * at the end of a stake have been updated
   * @param stakeId the stake id that was updated
   * @param settings the newly updated settings
   */
  event UpdatedSettings(uint256 indexed stakeId, uint256 settings);
  function defaultEncodedSettings(uint256 stakeDays) external pure returns(uint256) {
    return _defaultEncodedSettings(stakeDays);
  }
  function _defaultEncodedSettings(uint256 stakeDays) internal pure returns(uint256) {
    return uint256(0x000000000000000000000000000000000000010000000000000000010000ff0d) | (stakeDays << 16);
  }
  function _setDefaultSettings(uint256 stakeId, uint256 stakeDays) internal {
    _logSettingsUpdate(stakeId, _defaultEncodedSettings(stakeDays));
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
    idToSettings[stakeId] = settings;
    emit UpdatedSettings(stakeId, settings);
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
    uint256 fromEnd, uint256 length
  ) external pure returns(uint256) {
    return _readEncodedSettings(settings, fromEnd, length);
  }
  function _readEncodedSettings(
    uint256 settings,
    uint256 fromEnd, uint256 length
  ) internal pure returns(uint256) {
    return settings << fromEnd >> (256 - length);
  }
  /**
   * encode a settings struct into it's number
   * @param settings the settings struct to be encoded into a number
   */
  function encodeSettings(Settings memory settings) external pure returns(uint256 encoded) {
    return _encodeSettings(settings);
  }
  function _encodeSettings(Settings memory settings) internal pure returns(uint256 encoded) {
    return uint256(settings.tipMethod) << 248
      | uint256(settings.tipMagnitude) << 184
      | uint256(settings.withdrawableMethod) << 176
      | uint256(settings.withdrawableMagnitude) << 112
      | uint256(settings.newStakeMethod) << 104
      | uint256(settings.newStakeMagnitude) << 40
      | uint256(settings.newStakeDaysMethod) << 32
      | uint256(settings.newStakeDaysMagnitude) << 16
      | uint256(settings.copyIterations) << 8
      | uint256(settings.consentAbilities);
  }
  /**
   * decode an encoded setting into it's settings struct
   * @param encoded the encoded setting to decode
   * @return settings the decoded settings struct
   */
  function decodeSettings(uint256 encoded) external pure returns(Settings memory settings) {
    return _decodeSettings(encoded);
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
      uint8( encoded)
    );
  }
  function _defaultSettings(uint256 stakeDays) internal pure returns(Settings memory settings) {
    return Settings(
      uint8(0), uint64(0), // tip
      uint8(0), uint64(0), // withdrawable
      uint8(1), uint64(0), // new stake amount
      uint8(1), uint16(stakeDays), // new stake days
      type(uint8).max, // restart forever
      uint8(13) // "1101" allow end stake, no early end, hedron minting, end hedron mint
    );
  }
  function defaultSettings(uint256 stakeDays) external pure returns(Settings memory) {
    return _defaultSettings(stakeDays);
  }
}