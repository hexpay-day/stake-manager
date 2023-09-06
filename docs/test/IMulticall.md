# Solidity API

## IMulticall3

### Call

```solidity
struct Call {
  address target;
  bytes callData;
}
```

### Call3

```solidity
struct Call3 {
  address target;
  bool allowFailure;
  bytes callData;
}
```

### Call3Value

```solidity
struct Call3Value {
  address target;
  bool allowFailure;
  uint256 value;
  bytes callData;
}
```

### Result

```solidity
struct Result {
  bool success;
  bytes returnData;
}
```

### aggregate

```solidity
function aggregate(struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes[] returnData)
```

### aggregate3

```solidity
function aggregate3(struct IMulticall3.Call3[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### aggregate3Value

```solidity
function aggregate3Value(struct IMulticall3.Call3Value[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### blockAndAggregate

```solidity
function blockAndAggregate(struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes32 blockHash, struct IMulticall3.Result[] returnData)
```

### getBasefee

```solidity
function getBasefee() external view returns (uint256 basefee)
```

### getBlockHash

```solidity
function getBlockHash(uint256 blockNumber) external view returns (bytes32 blockHash)
```

### getBlockNumber

```solidity
function getBlockNumber() external view returns (uint256 blockNumber)
```

### getChainId

```solidity
function getChainId() external view returns (uint256 chainid)
```

### getCurrentBlockCoinbase

```solidity
function getCurrentBlockCoinbase() external view returns (address coinbase)
```

### getCurrentBlockDifficulty

```solidity
function getCurrentBlockDifficulty() external view returns (uint256 difficulty)
```

### getCurrentBlockGasLimit

```solidity
function getCurrentBlockGasLimit() external view returns (uint256 gaslimit)
```

### getCurrentBlockTimestamp

```solidity
function getCurrentBlockTimestamp() external view returns (uint256 timestamp)
```

### getEthBalance

```solidity
function getEthBalance(address addr) external view returns (uint256 balance)
```

### getLastBlockHash

```solidity
function getLastBlockHash() external view returns (bytes32 blockHash)
```

### tryAggregate

```solidity
function tryAggregate(bool requireSuccess, struct IMulticall3.Call[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### tryBlockAndAggregate

```solidity
function tryBlockAndAggregate(bool requireSuccess, struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes32 blockHash, struct IMulticall3.Result[] returnData)
```

