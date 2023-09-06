# Solidity API

## GoodAccounting

### checkStakeGoodAccounting

```solidity
function checkStakeGoodAccounting(uint256 stakeId) external
```

check that the provided stake can be ended and end it

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to end as custodied by this contract |

### checkStakeGoodAccountingFor

```solidity
function checkStakeGoodAccountingFor(address staker, uint256 index, uint256 stakeId) external
```

check that the stake can be good accounted, and execute the method if it will not fail

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| staker | address | the custodian of the provided stake |
| index | uint256 | the index of the stake |
| stakeId | uint256 | the stake id of the stake |

### isGoodAccountable

```solidity
function isGoodAccountable(address staker, uint256 index, uint256 stakeId) external view returns (enum GoodAccounting.GoodAccountingStatus)
```

run the appropriate checks if the stake is good accountable.
return 0 if it can be good accounted
return other numbers for those failed conditions

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| staker | address | the custodian of the provided stake |
| index | uint256 | the index of the stake |
| stakeId | uint256 | the stake id of the stake |

### isStakeIdGoodAccountable

```solidity
function isStakeIdGoodAccountable(uint256 stakeId) external view returns (enum GoodAccounting.GoodAccountingStatus)
```

### GoodAccountingStatus

```solidity
enum GoodAccountingStatus {
  READY,
  ENDED,
  EARLY,
  MISMATCH,
  MISCOUNT
}
```

### _isGoodAccountable

```solidity
function _isGoodAccountable(address staker, uint256 index, uint256 stakeId) internal view returns (enum GoodAccounting.GoodAccountingStatus)
```

### _checkStakeGoodAccounting

```solidity
function _checkStakeGoodAccounting(address staker, uint256 index, uint256 stakeId) internal
```

### stakeGoodAccounting

```solidity
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakerAddr | address | the originating stake address |
| stakeIndex | uint256 | the index of the stake on the address |
| stakeIdParam | uint40 | the stake id to verify the same stake is being targeted |

### _stakeGoodAccounting

```solidity
function _stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint256 stakeIdParam) internal
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakerAddr | address | the originating stake address |
| stakeIndex | uint256 | the index of the stake on the address |
| stakeIdParam | uint256 | the stake id to verify the same stake is being targeted |

