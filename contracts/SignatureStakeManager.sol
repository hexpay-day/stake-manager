// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ConsentualStakeManager.sol";

contract SignatureStakeManager is ConsentualStakeManager, EIP712 {
  constructor()
    ConsentualStakeManager()
    EIP712("ConsentualStakeManager", "0.0.0")
  {}
  /**
   * verify a signature in a general way to reveal consent on an
   * operation over a stake id
   * @param hashedInput the hashed input that you wish to check
   * @param nonce the nonce presented to allow for reversals
   * @param signature the signature presented claiming consent
   */
  function _verifySignature(
    bytes32 hashedInput,
    uint256 nonce,
    bytes calldata signature
  ) internal returns(address) {
    bytes32 digest = _hashTypedDataV4(hashedInput);
    address signer = ECDSA.recover(digest, signature);
    if (signer == address(0)) {
      revert InvalidSignature();
    }
    if (signerToNonceConsumed[signer][nonce]) {
      revert NonceConsumed(signer, nonce);
    }
    signerToNonceConsumed[signer][nonce] = true;
    return signer;
  }
  /**
   * show consent to early end stake by providing a singature
   * @param earliestDay the earliest day that the stake can be ended
   * @param stakeId the stake id in question
   * @param nonce a nonce associated with the signature - used to cancel out signatures
   * @param signature the signature proving consent to end the stake
   * does not match the one at the index
   * @notice if the earliest day does not match the signature
   * or that day has not been reached then the method will fail
   */
  function stakeEndBySignature(
    uint256 stakeId,
    uint256 earliestDay, uint256 nonce,
    bytes calldata signature
  ) external payable returns(uint256 delta) {
    if (_currentDay() < earliestDay) {
      revert StakeNotEnded(earliestDay, _currentDay());
    }
    bytes32 hashedInput = keccak256(abi.encode(
      keccak256("ConsentEarlyEnd(uint256 earliestDay,uint256 stakeId,uint256 nonce)"),
      earliestDay,
      stakeId,
      nonce
    ));
    _verifyStakeOwnership(_verifySignature(hashedInput, nonce, signature), stakeId);
    delta = _stakeEndByConsent(stakeId);
  }
  /**
   * show consent for updating settings on a particular stake id
   * @param stakeId the stake id to operate on
   * @param nonce the globally shared nonce
   * @param settings the settings to update to
   * @param signature the signature showing consent
   * @dev this method does not make sense to run until it is economically reasonable to do so
   * which may mean collecting signatures throughout the day and
   * running them at the end before the day ticks over such that you reduce sloads
   */
  function updateSettingsBySignature(
    uint256 stakeId, uint256 nonce,
    Settings calldata settings,
    bytes calldata signature
  ) external payable {
    bytes32 hashedInput = keccak256(abi.encode(
      // solhint-disable-next-line
      keccak256("ConsentUpdateSettings(uint256 stakeId,uint256 nonce,(uint8,uint64,uint8,uint64,uint8,uint64,uint16,uint8,uint16) settings)"),
      stakeId,
      nonce,
      settings
    ));
    address signer = _verifySignature(hashedInput, nonce, signature);
    _verifyStakeOwnership(signer, stakeId);
    return _logSettingsUpdate(stakeId, _encodeSettings(settings));
  }
  /**
   * withdraw tokens to a provided address, as authorized by a signature over the destination and amount
   * @param to the account to withdraw tokens to
   * @param amount the amount of tokens to withdraw
   * @param nonce the nonce (provided by the relayer)
   * @param signature the signature
   */
  function withdrawTokenToBySignature(
    address to, uint256 amount,
    uint256 nonce,
    bytes calldata signature
  ) external payable {
    bytes32 hashedInput = keccak256(abi.encode(
      keccak256("ConsentWithdrawTokenTo(address to,uint256 amount,uint256 nonce)"),
      to,
      amount,
      nonce
    ));
    address signer = _verifySignature(hashedInput, nonce, signature);
    _withdrawTokenTo(to, _deductWithdrawable(signer, amount));
  }
}
