// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./UnderlyingStakeable.sol";

contract AuthorizationManager is UnderlyingStakeable {
  mapping(bytes32 => uint256) public authorization;
  event UpdateAuthorization(bytes32 key, uint256 settings);
  uint256 immutable MAX_AUTHORIZATION;
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
    emit UpdateAuthorization(key, settings);
  }
  modifier senderIsAuthorized(uint256 index) {
    if (checkBinary(authorization[bytes32(uint256(uint160(msg.sender)))], index)) {
      _;
    }
  }
  function isAddressAuthorized(address target, uint256 index) view internal returns(bool) {
    return checkBinary(authorization[bytes32(uint256(uint160(target)))], index);
  }
  function isAuthorized(bytes32 key, uint256 index) view internal returns(bool) {
    return checkBinary(authorization[key], index);
  }
  function isCapable(uint256 setting, uint256 index) external pure returns(bool) {
    return checkBinary(setting, index);
  }
  function checkBinary(uint256 setting, uint256 index) internal pure returns(bool) {
    // in binary checks:
    // take the setting and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    return 1 == (setting << (255 - index) >> 255);
  }
}
