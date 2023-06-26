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
    // useful to use methods 6+7 for stake days
    uint8 newStakeDaysMethod;
    uint16 newStakeDaysMagnitude;
    uint8 copyIterations; // 0 for do not restart, 1-254 as countdown, 255 as restart indefinitely
    /**
     * 00001(0): stake end
     * 00010(1): early stake end
     * 00100(2): mint hedron (any time)
     * 01000(3): mint hedron during end stake
     * 10000(4): has eth tip
     */
    uint8 consentAbilities;
  }
  mapping(uint256 => uint256) public idToSettings;
  /**
   * an event to signal that settings to direct funds
   * at the end of a stake have been updated
   * @param stakeId the stake id that was updated
   * @param settings the newly updated settings
   */
  event UpdatedSettings(uint256 indexed stakeId, uint256 settings);
  uint256 public constant DEFAULT_ENCODED_SETTINGS
    = uint256(0x000000000000000000000000000000000000010000000000000000060000ff01);
  function _setDefaultSettings(uint256 stakeId) internal {
    _logSettingsUpdate(stakeId, DEFAULT_ENCODED_SETTINGS);
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
    // preserve the 251st index
    uint256 updatedSettings = (settings >> 8 << 8) | (settings << 252 >> 252) | (uint8(idToSettings[stakeId]) >> 4 << 4);
    idToSettings[stakeId] = updatedSettings;
    emit UpdatedSettings(stakeId, updatedSettings);
  }
  function idToDecodedSettings(uint256 stakeId) external view returns (Settings memory) {
    return _decodeSettings(idToSettings[stakeId]);
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
  function _defaultSettings() internal pure returns(Settings memory settings) {
    return Settings(
      /*
       * by default, there is no tip
       * assume that stakers will manage their own stakes at bare minimum
       */
      uint8(0), uint64(0), // tip
      /*
       * by default, no tokens are ever sent back to the originating staker
       * assume that stakers wish to keep tokens in this singleton contract for efficiency purposes
       */
      uint8(0), uint64(0), // withdrawable
      /*
       * by default, assume that all tokens minted from an end stake
       * should go directly into a new stake
       */
      uint8(1), uint64(0), // new stake amount
      /*
       * by default, assume that by using this contract, users want efficiency gains
       * so by default, restarting their stakes are the most efficient means of managing tokens
       */
      uint8(6), uint16(0),
      255, // restart forever
      /*
       * 0x01 -> 0001
       * by index:
       * 3: do not allow end hedron mint (0)
       * 2: do not allow continuous hedron mint (0)
       * 1: do not allow early end (0)
       * 0: allow end stake in general (1)
       *
       * restarting is signalled by using settings above
       * no "starts" as in pull from external address
       * is ever allowed except by sender
       *
       * the reason why the hedron flags are 0 by default is because
       * it may be worthwhile for hedron developers to build on top of this contract
       * and it is poor form to force people in the future to have to cancel out the past
       */
      uint8(1)
    );
  }
  /**
   * exposes the default settings to external
   */
  function defaultSettings() external pure returns(Settings memory) {
    return _defaultSettings();
  }
}
