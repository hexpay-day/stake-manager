
## TransferableStakeManager

### TransferStake

```solidity
event TransferStake(address from, address to, uint256 stakeId)
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

removes transfer abilities from a stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake that the sender owns and wishes to remove transfer abilities from |

### removeTransferrabilityFromEncodedSettings

```solidity
function removeTransferrabilityFromEncodedSettings(uint256 settings) external pure returns (uint256)
```

rewrite encoded settings to remove the transferable flag and leave all other settings in tact

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | uint256 | encoded settings to rewrite without a transferable flag |

### _removeTransferrabilityFromEncodedSettings

```solidity
function _removeTransferrabilityFromEncodedSettings(uint256 settings) internal pure returns (uint256)
```

rewrite encoded settings to remove the transferable flag and leave all other settings in tact

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | uint256 | encoded settings to rewrite without a transferable flag |

### canTransfer

```solidity
function canTransfer(uint256 stakeId) external view returns (bool)
```

check if a given stake under a stake id can be transferred

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check transferrability setting |

### _canTransfer

```solidity
function _canTransfer(uint256 stakeId) internal view returns (bool)
```

check if a given stake under a stake id can be transferred

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check transferrability setting |

### stakeTransfer

```solidity
function stakeTransfer(uint256 stakeId, address to) external payable
```

transfer a stake from one owner to another

_this method is only payable to reduce gas costs.
Any value sent to this method will be unattributed_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to transfer |
| to | address | the account to receive the stake |

