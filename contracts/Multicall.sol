// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * this multicall extension is useful for permissioned calls
 * in other words, calls that operate on the senders funds or settings
 */
contract Multicall {
  event TxFailed(uint256 index);
  /**
   * call multiple / arbitrary steps allowing each to fail independently or requiring all to succeed
   * @param calls the sequence of calls that is requested
   * @param allowFailures allows the calls to fail separately or requires all to succeed or fail
   * @notice while the method is payable, this is only for gas optimization purposes
   * no value is passable, nor should it be used in any of the required contracts
   */
  function multicall(bytes[] calldata calls, bool allowFailures) external payable {
    uint256 len = calls.length;
    uint256 i;
    do {
      (bool success, bytes memory result) = address(this).delegatecall(calls[i]);
      if (!success) {
        if (allowFailures) {
          emit TxFailed(i);
        } else {
          assembly {
            revert(add(result, 0x20), mload(result))
          }
        }
      }
      ++i;
    } while (i < len);
  }
}
