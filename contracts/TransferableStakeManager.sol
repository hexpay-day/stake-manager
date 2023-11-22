// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { StakeStarter } from "./StakeStarter.sol";
import { StakeReceiver } from "./interfaces/StakeReceiver.sol";

contract TransferableStakeManager is StakeStarter {
  /**
   * a stake's ownership has been transferred from one address to another
   * if 2 contracts are involved, they can use the owner param to internal accounting ownership
   * @param from the address who owns the stake according to stake manager contracts
   * @param to the address where the stake is being transferred
   * @param owner the owner of the stake if there is separate accounting occuring in the "from" address
   * @param stakeId the stake id being transferred
   */
  event TransferStake(
    address from,
    address indexed to,
    address indexed owner,
    uint256 indexed stakeId
  );

  error InvalidStakeReceiver(address to);
  /**
   * removes transfer abilities from a stake
   * @param stakeId the stake that the sender owns and wishes to remove transfer abilities from
   */
  function removeTransferrability(uint256 stakeId) external payable returns(uint256 settings) {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    settings = stakeIdToSettings[stakeId];
    settings = _removeTransferrabilityFromSettings({
      settings: settings
    });
    _logSettingsUpdate({
      stakeId: stakeId,
      settings: settings
    });
  }
  /**
   * rewrite encoded settings to remove the transferable flag and leave all other settings in tact
   * @param settings encoded settings to rewrite without a transferable flag
   */
  function removeTransferrabilityFromSettings(uint256 settings) external pure returns(uint256) {
    return _removeTransferrabilityFromSettings({
      settings: settings
    });
  }
  /**
   * rewrite encoded settings to remove the transferable flag and leave all other settings in tact
   * @param settings encoded settings to rewrite without a transferable flag
   */
  function _removeTransferrabilityFromSettings(uint256 settings) internal pure returns(uint256) {
    unchecked {
      return (
        (settings >> INDEX_RIGHT_COPY_EXTERNAL_TIPS << INDEX_RIGHT_COPY_EXTERNAL_TIPS)
        | (settings << INDEX_LEFT_STAKE_IS_TRANSFERABLE >> INDEX_LEFT_STAKE_IS_TRANSFERABLE) // wipe transferable
      );
    }
  }
  /**
   * check if a given stake under a stake id can be transferred
   * @param stakeId the stake id to check transferrability settings
   */
  function canTransfer(uint256 stakeId) external view returns(bool) {
    return _canTransfer({
      stakeId: stakeId
    });
  }
  /**
   * check if a given stake under a stake id can be transferred
   * @param stakeId the stake id to check transferrability settings
   */
  function _canTransfer(uint256 stakeId) internal view returns(bool) {
    return _isOneAtIndex({
      settings: stakeIdToSettings[stakeId],
      index: INDEX_RIGHT_STAKE_IS_TRANSFERABLE
    });
  }
  /**
   * transfer a stake from one owner to another
   * @param to the account to receive the stake
   * @param owner the owner address if there is internal
   * accounting of stakes via contract
   * @param stakeId the stake id to transfer
   * @dev this method is only payable to reduce gas costs.
   * Any value sent to this method will be unattributed
   */
  function stakeTransfer(address to, address owner, uint256 stakeId) external payable {
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
    if (tipStakeIdToStaker[stakeId] != address(0)) {
      tipStakeIdToStaker[stakeId] = to;
    }
    emit TransferStake({
      from: msg.sender,
      to: to,
      owner: owner,
      stakeId: stakeId
    });
    // to is now the owner according to this contract,
    // however to may wish to attribute ownership differently internally
    // therefore, the "owner" param is provided
    // eoa's skipped
    if (to.code.length > ZERO) {
      // contracts must implement onStakeReceived to hold stakes
      try StakeReceiver(to).onStakeReceived({
        from: msg.sender,
        owner: owner,
        stakeId: stakeId
      }) returns (bytes4 result) {
        if (result != StakeReceiver.onStakeReceived.selector) {
          revert InvalidStakeReceiver(to);
        }
      } catch (bytes memory reason) {
        _bubbleRevert(reason);
      }
    }
  }
}
