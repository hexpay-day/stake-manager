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
  /**
   * check if an address is authorized to perform an action
   * this index will be different for each implementation
   * @param target the address to verify is authorized to do an action
   * @param index the index of the bit to check
   * @dev the index is an index of the bits as in binary (1/0)
   */
  function isAddressAuthorized(address target, uint256 index) view external returns(bool) {
    return _isAddressAuthorized(target, index);
  }
  function _isAddressAuthorized(address target, uint256 index) view internal returns(bool) {
    return checkBinary(authorization[bytes32(uint256(uint160(target)))], index);
  }
  function _isAuthorized(bytes32 key, uint256 index) view internal returns(bool) {
    return checkBinary(authorization[key], index);
  }
}
