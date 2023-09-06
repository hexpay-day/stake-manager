# Solidity API

## MulticallExtension

this multicall extension is useful for chaining permissioned calls
in other words, calls that operate on the senders funds or settings

### BlockHash

```solidity
error BlockHash(bytes32 expected, bytes32 actual)
```

### Deadline

```solidity
error Deadline(uint256 deadline, uint256 currentTime)
```

### TxFailed

```solidity
event TxFailed(uint256 index, bytes result)
```

### multicall

```solidity
function multicall(bytes[] calls, bool allowFailures) external
```

call a series of functions on a contract that inherits this method

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calls | bytes[] | the calls to perform on this contract |
| allowFailures | bool | whether to allow failures or to error out |

### multicallWithDeadline

```solidity
function multicallWithDeadline(uint256 deadline, bytes[] calls, bool allowFailures) external
```

call multiple methods and pass a deadline, after which the transaction should fail

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| deadline | uint256 | the timestamp, in seconds |
| calls | bytes[] | the calldata to run on the external method |
| allowFailures | bool | allows failures when true |

### multicallWithPreviousBlockHash

```solidity
function multicallWithPreviousBlockHash(bytes32 previousBlockhash, bytes[] calls, bool allowFailures) external
```

pass the previous block hash to enable mev uncle bandit protection

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| previousBlockhash | bytes32 | the previously mined block - useful for mev protected uncle bandit risks |
| calls | bytes[] | the calldata to run on the external method |
| allowFailures | bool | allows failures when true |

### _multicall

```solidity
function _multicall(bytes[] calls, bool allowFailures) internal
```

call multiple / arbitrary steps allowing each to fail independently or requiring all to succeed
while the method is payable, this is only for gas optimization purposes
no value is passable, nor should it be used in any of the required contracts

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calls | bytes[] | the sequence of calls that is requested |
| allowFailures | bool | allows the calls to fail separately or requires all to succeed or fail |

