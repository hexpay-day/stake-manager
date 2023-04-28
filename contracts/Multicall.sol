// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Multicall {
  event TxFailed(uint256 index);
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
