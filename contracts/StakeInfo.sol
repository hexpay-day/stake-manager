// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./Stakeable.sol";

contract StakeInfo {
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
  function _verifyStakeOwnership(address owner, uint256 stakeId) internal view {
    if (_stakeIdToOwner(stakeId) != owner) {
      revert StakeNotOwned(owner, _stakeIdToOwner(stakeId));
    }
  }
  function _verifyCustodian(uint256 stakeId) internal view {
    if (_stakeIdToOwner(stakeId) == address(0)) {
      revert StakeNotOwned(_stakeIdToOwner(stakeId), address(this));
    }
  }
  /**
   * get the owner of the stake id - the account that has rights over
   * the stake's settings and ability to end it outright
   * @param stakeId the stake id in question
   */
  function stakeIdToOwner(uint256 stakeId) external view returns(address) {
    return _stakeIdToOwner(stakeId);
  }
  function _stakeIdToOwner(uint256 stakeId) internal view returns(address) {
    return address(uint160(stakeIdInfo[stakeId]));
  }
  function _stakeIdToInfo(uint256 stakeId) internal view returns(uint256, address) {
    uint256 info = stakeIdInfo[stakeId];
    return (info >> 160, address(uint160(info)));
  }
  /**
   * the index of the stake id - useful when indexes are moving around
   * and could be moved by other people
   * @param stakeId the stake id to target
   */
  function stakeIdToIndex(uint256 stakeId) external view returns(uint256) {
    return _stakeIdToIndex(stakeId);
  }
  function _stakeIdToIndex(uint256 stakeId) internal view returns(uint256) {
    return stakeIdInfo[stakeId] >> 160;
  }
  function _encodeInfo(uint256 index, address staker) internal pure returns(uint256) {
    return (index << 160) | uint160(staker);
  }
}