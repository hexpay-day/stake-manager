// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./Capable.sol";
import "./UnderlyingStakeable.sol";

contract AuthorizationManager is UnderlyingStakeable, Capable {
  mapping(bytes32 key => uint256) public authorization;
  event UpdateAuthorization(bytes32 key, uint256 settings);
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
    emit UpdateAuthorization(key, settings);
  }
  function _setAddressAuthorization(address account, uint256 settings) internal {
    _setAuthorization(bytes32(uint256(uint160(account))), settings);
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
}
