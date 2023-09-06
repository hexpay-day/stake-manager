# Solidity API

## TransferrableStakeManager

### TransferStake

```solidity
event TransferStake(uint256 stakeId, address owner)
```

### removeTransferrability

```solidity
function removeTransferrability(uint256 stakeId) external payable returns (uint256 settings)
```

removes transfer abilities from a stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake that the sender owns and wishes to remove transfer abilities from |

### _updateTransferrability

```solidity
function _updateTransferrability(uint256 stakeId, uint256 encoded) internal returns (uint256 settings)
```

### canTransfer

```solidity
function canTransfer(uint256 stakeId) external view returns (bool)
```

### _canTransfer

```solidity
function _canTransfer(uint256 stakeId) internal view returns (bool)
```

### stakeTransfer

```solidity
function stakeTransfer(uint256 stakeId, address to) external payable
```

