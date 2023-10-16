// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

abstract contract Multicall {
  struct Call {
    address target;
    bytes callData;
  }

  struct Call3 {
    address target;
    bool allowFailure;
    bytes callData;
  }

  struct Call3Value {
    address target;
    bool allowFailure;
    uint256 value;
    bytes callData;
  }

  struct Result {
    bool success;
    bytes returnData;
  }

  function aggregate(Call[] calldata calls)
    external virtual
    payable
    returns (uint256 blockNumber, bytes[] memory returnData);

  function aggregate3(Call3[] calldata calls) external virtual payable returns (Result[] memory returnData);

  function aggregate3Value(Call3Value[] calldata calls)
    external virtual
    payable
    returns (Result[] memory returnData);

  function blockAndAggregate(Call[] calldata calls)
    external virtual
    payable
    returns (uint256 blockNumber, bytes32 blockHash, Result[] memory returnData);

  function getBasefee() external virtual view returns (uint256 basefee);

  function getBlockHash(uint256 blockNumber) external virtual view returns (bytes32 blockHash);

  function getBlockNumber() external virtual view returns (uint256 blockNumber);

  function getChainId() external virtual view returns (uint256 chainid);

  function getCurrentBlockCoinbase() external virtual view returns (address coinbase);

  function getCurrentBlockDifficulty() external virtual view returns (uint256 difficulty);

  function getCurrentBlockGasLimit() external virtual view returns (uint256 gaslimit);

  function getCurrentBlockTimestamp() external virtual view returns (uint256 timestamp);

  function getEthBalance(address addr) external virtual view returns (uint256 balance);

  function getLastBlockHash() external virtual view returns (bytes32 blockHash);

  function tryAggregate(bool requireSuccess, Call[] calldata calls)
    external virtual
    payable
    returns (Result[] memory returnData);

  function tryBlockAndAggregate(bool requireSuccess, Call[] calldata calls)
    external virtual
    payable
    returns (uint256 blockNumber, bytes32 blockHash, Result[] memory returnData);
}
