// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import "./StakeStarter.sol";

contract TransferrableStakeManager is StakeStarter {
  event TransferStake(uint256 stakeId, address owner);
  /**
   * removes transfer abilities from a stake
   * @param stakeId the stake that the sender owns and wishes to remove transfer abilities from
   */
  function removeTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    return _removeTransferrability({
      stakeId: stakeId
    });
  }
  function _removeTransferrability(uint256 stakeId) internal returns(uint256 settings) {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    settings = stakeIdToSettings[stakeId];
    settings = _removeTransferrabilityFromEncodedSettings(settings);
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  function removeTransferrabilityFromEncodedSettings(uint256 settings) external pure returns(uint256) {
    return _removeTransferrabilityFromEncodedSettings(settings);
  }
  function _removeTransferrabilityFromEncodedSettings(uint256 settings) internal pure returns(uint256) {
    return (
      (settings >> INDEX_COPY_EXTERNAL_TIPS << INDEX_COPY_EXTERNAL_TIPS)
      | (settings << INDEX_LEFT_STAKE_IS_TRANSFERRABLE >> INDEX_LEFT_STAKE_IS_TRANSFERRABLE) // wipe transferrable
    );
  }
  function canTransfer(uint256 stakeId) external view returns(bool) {
    return _canTransfer({
      stakeId: stakeId
    });
  }
  function _canTransfer(uint256 stakeId) internal view returns(bool) {
    return _isOneAtIndex({
      setting: stakeIdToSettings[stakeId],
      index: INDEX_STAKE_IS_TRANSFERRABLE
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
    _transferTipLock(stakeId, true);
    emit TransferStake({
      stakeId: stakeId,
      owner: to
    });
  }
}
