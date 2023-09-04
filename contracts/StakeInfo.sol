// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import { Utils } from "./Utils.sol";

contract StakeInfo is Utils {
  /**
   * @notice the owner of a stake indexed by the stake id
   * index + 160(owner)
   */
  mapping(uint256 => uint256) public stakeIdInfo;
  /**
   * @notice this error is thrown when the stake in question
   * is not owned by the expected address
   */
  error StakeNotOwned(address provided, address expected);
  error StakeNotCustodied(uint256 stakeId);
  function verifyStakeOwnership(address owner, uint256 stakeId) external view {
    _verifyStakeOwnership(owner, stakeId);
  }
  function _verifyStakeOwnership(address owner, uint256 stakeId) internal view {
    if (_stakeIdToOwner(stakeId) != owner) {
      revert StakeNotOwned(owner, _stakeIdToOwner(stakeId));
    }
  }
  function verifyCustodian(uint256 stakeId) external view {
    _verifyCustodian(stakeId);
  }
  function _verifyCustodian(uint256 stakeId) internal view {
    if (_stakeIdToOwner(stakeId) == address(0)) {
      revert StakeNotCustodied(stakeId);
    }
  }
  /**
   * get the owner of the stake id - the account that has rights over
   * the stake's settings and ability to end it outright
   * @param stakeId the stake id in question
   */
  function stakeIdToOwner(uint256 stakeId) external view returns(address owner) {
    return _stakeIdToOwner(stakeId);
  }
  function _stakeIdToOwner(uint256 stakeId) internal view returns(address owner) {
    return address(uint160(stakeIdInfo[stakeId]));
  }
  function stakeIdToInfo(uint256 stakeId) external view returns(uint256 id, address owner) {
    return _stakeIdToInfo(stakeId);
  }
  function _stakeIdToInfo(uint256 stakeId) internal view returns(uint256 id, address owner) {
    uint256 info = stakeIdInfo[stakeId];
    return (info >> ADDRESS_BIT_LENGTH, address(uint160(info)));
  }
  /**
   * the index of the stake id - useful when indexes are moving around
   * and could be moved by other people
   * @param stakeId the stake id to target
   */
  function stakeIdToIndex(uint256 stakeId) external view returns(uint256 index) {
    return _stakeIdToIndex(stakeId);
  }
  function _stakeIdToIndex(uint256 stakeId) internal view returns(uint256 index) {
    return stakeIdInfo[stakeId] >> ADDRESS_BIT_LENGTH;
  }
  function encodeInfo(uint256 index, address owner) external pure returns(uint256 info) {
    return _encodeInfo(index, owner);
  }
  function _encodeInfo(uint256 index, address owner) internal pure returns(uint256 info) {
    return (index << ADDRESS_BIT_LENGTH) | uint160(owner);
  }
}
