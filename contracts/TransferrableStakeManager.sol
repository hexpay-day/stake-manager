// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./StakeEnder.sol";

contract TransferrableStakeManager is StakeEnder {
  event TransferStake(uint256 stakeId, address owner);
  /**
   * removes transfer abilities from a stake
   * @param stakeId the stake that the sender owns and wishes to remove transfer abilities from
   */
  function removeTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    return _updateTransferrability(stakeId, 0);
  }
  function _updateTransferrability(uint256 stakeId, uint256 val) internal returns(uint256 settings) {
    _verifyStakeOwnership(msg.sender, stakeId);
    settings = stakeIdToSettings[stakeId];
    settings = (settings >> 6 << 6) | (settings << 251 >> 251) | val << 5;
    _logSettingsUpdate(stakeId, settings);
  }
  function canTransfer(uint256 stakeId) external view returns(bool) {
    return _canTransfer(stakeId);
  }
  function _canTransfer(uint256 stakeId) internal view returns(bool) {
    return _isCapable(stakeIdToSettings[stakeId], 5);
  }
  function stakeTransfer(uint256 stakeId, address to) external payable {
    _verifyStakeOwnership(msg.sender, stakeId);
    if (!_canTransfer(stakeId)) {
      revert NotAllowed();
    }
    (uint256 index, ) = _stakeIdToInfo(stakeId);
    stakeIdInfo[stakeId] = _encodeInfo(index, to);
    emit TransferStake(stakeId, to);
  }
}
