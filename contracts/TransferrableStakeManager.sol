// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./StakeStarter.sol";

contract TransferrableStakeManager is StakeStarter {
  event TransferStake(uint256 stakeId, address owner);
  /**
   * removes transfer abilities from a stake
   * @param stakeId the stake that the sender owns and wishes to remove transfer abilities from
   */
  function removeTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    return _updateTransferrability({
      stakeId: stakeId,
      encoded: 0
    });
  }
  function _updateTransferrability(uint256 stakeId, uint256 encoded) internal returns(uint256 settings) {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    settings = stakeIdToSettings[stakeId];
    settings = (settings >> 6 << 6) | (settings << 251 >> 251) | encoded << 5;
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  function canTransfer(uint256 stakeId) external view returns(bool) {
    return _canTransfer({
      stakeId: stakeId
    });
  }
  function _canTransfer(uint256 stakeId) internal view returns(bool) {
    return _isCapable({
      setting: stakeIdToSettings[stakeId],
      index: 5
    });
  }
  function stakeTransfer(uint256 stakeId, address to) external payable {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    if (!_canTransfer({ stakeId: stakeId })) {
      revert NotAllowed();
    }
    (uint256 index, ) = _stakeIdToInfo({
      stakeId: stakeId
    });
    stakeIdInfo[stakeId] = _encodeInfo({
      index: index,
      owner: to
    });
    emit TransferStake({
      stakeId: stakeId,
      owner: to
    });
  }
}
