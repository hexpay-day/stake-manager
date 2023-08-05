// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./Capable.sol";
import "./UnderlyingStakeable.sol";

contract AuthorizationManager is UnderlyingStakeable, Capable {
  /**
   * tracks which keys are provided which authorization permissions
   * @dev most of the time the keys will be addresses
   * so you will often have to encode the addresses as byte32
   */
  mapping(bytes32 => uint256) public authorization;
  /**
   * emitted after settings are updated to allow various
   * addresses and key combinations to act on owners behalf
   * @param key the key, usually an address, that is authorized to perform new actions
   * @param settings the settings number - used as binary
   */
  event UpdateAuthorization(bytes32 key, uint256 settings);
  /**
   * the maximum authorization value that a setting can hold
   * @notice - this is enforced during _setAuthorization only so it
   * could be set elsewhere if the contract decides to
   */
  uint256 public immutable MAX_AUTHORIZATION;
  constructor(uint256 maxAuthorization) {
    MAX_AUTHORIZATION = maxAuthorization;
  }
  /**
   * set the authorization status of an address
   * @param key the address to set the authorization flag of
   * @param settings allowed to start / end / early end stakes
   */
  function _setAuthorization(bytes32 key, uint256 settings) internal {
    if (settings > MAX_AUTHORIZATION) {
      revert NotAllowed();
    }
    authorization[key] = settings;
    emit UpdateAuthorization({
      key: key,
      settings: settings
    });
  }
  function _setAddressAuthorization(address account, uint256 settings) internal {
    _setAuthorization({
      key: bytes32(uint256(uint160(account))),
      settings: settings
    });
  }
  /**
   * check if an address is authorized to perform an action
   * this index will be different for each implementation
   * @param account the address to verify is authorized to do an action
   * @param index the index of the bit to check
   * @dev the index is an index of the bits as in binary (1/0)
   */
  function isAddressAuthorized(address account, uint256 index) view external returns(bool) {
    return _isAddressAuthorized({
      account: account,
      index: index
    });
  }
  /**
   * check if the provided address is authorized to perform an action
   * @param account the address to check authorization against
   * @param index the index of the setting boolean to check
   */
  function _isAddressAuthorized(address account, uint256 index) view internal returns(bool) {
    return _isAuthorized({
      key: bytes32(uint256(uint160(account))),
      index: index
    });
  }
  /**
   * check the index of the setting for the provided key
   * return true if flag is true
   * @param key the key to check against the authorization mapping
   * @param index the index of the setting flag to check
   */
  function _isAuthorized(bytes32 key, uint256 index) view internal returns(bool) {
    return _isCapable({
      setting: authorization[key],
      index: index
    });
  }
  function _getAddressSetting(address account) view internal returns(uint256) {
    return authorization[bytes32(uint256(uint160(account)))];
  }
}
