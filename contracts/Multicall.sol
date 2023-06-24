// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * this multicall extension is useful for permissioned calls
 * in other words, calls that operate on the senders funds or settings
 */
contract Multicall {
  error BlockHash(bytes32 expected, bytes32 actual);
  error Deadline(uint256 deadline, uint256 currentTime);
  event TxFailed(uint256 indexed index, bytes result);
  modifier checkPreviousBlockhash(bytes32 previousBlockhash) {
    if (blockhash(block.number - 1) != previousBlockhash) {
      revert BlockHash(previousBlockhash, blockhash(block.number - 1));
    }
    _;
  }
  modifier checkDeadline(uint256 deadline) {
    if (block.timestamp > deadline) {
      revert Deadline(deadline, block.timestamp);
    }
    _;
  }
  /**
   * call a series of functions on a contract that inherits this method
   * @param data the calls to perform on this contract
   * @param allowFailures whether to allow failures or to error out
   */
  function multicall(
    bytes[] calldata data,
    bool allowFailures
  ) external {
    _multicall(data, allowFailures);
  }
  /**
   * call multiple methods and pass a deadline, after which the transaction should fail
   * @param deadline the timestamp, in seconds
   * @param data the calldata to run on the external method
   * @param allowFailures allows failures when true
   */
  function multicallWithDeadline(
    uint256 deadline,
    bytes[] calldata data,
    bool allowFailures
  )
    external
    checkDeadline(deadline)
  {
    _multicall(data, allowFailures);
  }
  /**
   * pass the previous block hash to enable mev uncle bandit protection
   * @param previousBlockhash the previously mined block - useful for mev protected uncle bandit risks
   * @param data the calldata to run on the external method
   * @param allowFailures allows failures when true
   */
  function multicallWithPreviousBlockHash(
    bytes32 previousBlockhash,
    bytes[] calldata data,
    bool allowFailures
  )
    external
    checkPreviousBlockhash(previousBlockhash)
  {
    _multicall(data, allowFailures);
  }
  /**
   * call multiple / arbitrary steps allowing each to fail independently or requiring all to succeed
   * @param calls the sequence of calls that is requested
   * @param allowFailures allows the calls to fail separately or requires all to succeed or fail
   * @notice while the method is payable, this is only for gas optimization purposes
   * no value is passable, nor should it be used in any of the required contracts
   */
  function _multicall(bytes[] calldata calls, bool allowFailures) internal {
    uint256 len = calls.length;
    uint256 i;
    do {
      (bool success, bytes memory result) = address(this).delegatecall(calls[i]);
      if (!success) {
        if (allowFailures) {
          emit TxFailed(i, result);
        } else {
          assembly {
            revert(add(result, 0x20), mload(result))
          }
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
  }
}
