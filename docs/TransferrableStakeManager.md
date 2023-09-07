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

### _removeTransferrability

```solidity
function _removeTransferrability(uint256 stakeId) internal returns (uint256 settings)
```

### removeTransferrabilityFromEncodedSettings

```solidity
function removeTransferrabilityFromEncodedSettings(uint256 settings) external pure returns (uint256)
```

### _removeTransferrabilityFromEncodedSettings

```solidity
function _removeTransferrabilityFromEncodedSettings(uint256 settings) internal pure returns (uint256)
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

