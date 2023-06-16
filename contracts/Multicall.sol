// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

/**
 * this multicall extension is useful for permissioned calls
 * in other words, calls that operate on the senders funds or settings
 */
contract Multicall {
  error BlockHash();
  error Deadline();
  event TxFailed(uint256 index);
  modifier checkCurrentBlockhash(bytes32 currentBlockhash) {
    if (blockhash(block.number) != currentBlockhash) {
      revert BlockHash();
    }
    _;
  }
  modifier checkPreviousBlockhash(bytes32 previousBlockhash) {
    if (blockhash(block.number - 1) != previousBlockhash) {
      revert BlockHash();
    }
    _;
  }
  modifier checkDeadline(uint256 deadline) {
    if (block.timestamp > deadline) {
      revert Deadline();
    }
    _;
  }
  function multicall(
    bytes[] calldata data,
    bool allowFailures
  ) external payable {
    _multicall(data, allowFailures);
  }
  function multicallWithDeadline(
    uint256 deadline,
    bytes[] calldata data,
    bool allowFailures
  )
    external
    payable
    checkDeadline(deadline)
  {
    _multicall(data, allowFailures);
  }
  function multicallWithCurrentBlockHash(
    bytes32 currentBlockhash,
    bytes[] calldata data,
    bool allowFailures
  )
    external
    payable
    checkCurrentBlockhash(currentBlockhash)
  {
    _multicall(data, allowFailures);
  }
  function multicallWithPreviousBlockHash(
    bytes32 previousBlockhash,
    bytes[] calldata data,
    bool allowFailures
  )
    external
    payable
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
    if (allowFailures) {
      do {
        (bool success, ) = address(this).delegatecall(calls[i]);
        if (!success) {
          emit TxFailed(i);
        }
        ++i;
      } while (i < len);
    } else {
      do {
        (bool success, bytes memory result) = address(this).delegatecall(calls[i]);
        if (!success) {
          assembly {
            revert(add(result, 0x20), mload(result))
          }
        }
        ++i;
      } while (i < len);
    }
  }
}
