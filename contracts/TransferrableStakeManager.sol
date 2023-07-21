// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./StakeEnder.sol";

contract TransferrableStakeManager is StakeEnder {
  /**
   * removes transfer abilities from a stake
   * @param stakeId the stake that the sender owns and wishes to remove transfer abilities from
   */
  function removeTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    return _updateTransferrability(stakeId, 0);
  }
  function allowTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    return _updateTransferrability(stakeId, 1);
  }
  function _updateTransferrability(uint256 stakeId, uint256 val) internal returns(uint256 settings) {
    _verifyStakeOwnership(msg.sender, stakeId);
    settings = stakeIdToSettings[stakeId];
    settings = (settings >> 6 << 6) | (settings << 251 >> 251) | val;
    stakeIdToSettings[stakeId] = settings;
  }
  function stakeTransfer(uint256 stakeId, address to) external payable {
    (uint256 index, address owner) = _stakeIdToInfo(stakeId);
    if (msg.sender != owner) {
      revert StakeNotOwned(msg.sender, owner);
    }
    uint256 settings = stakeIdToSettings[stakeId];
    if (!_isCapable(settings, 5)) {
      revert NotAllowed();
    }
    stakeIdInfo[stakeId] = _encodeInfo(index, to);
  }
}
