# Solidity API

## IUnderlyingStakeable

this is the minimum interface needed to start and end stakes appropriately on hex

### StakeStore

```solidity
struct StakeStore {
  uint40 stakeId;
  uint72 stakedHearts;
  uint72 stakeShares;
  uint16 lockedDay;
  uint16 stakedDays;
  uint16 unlockedDay;
  bool isAutoStake;
}
```

### stakeStart

```solidity
function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external
```

starts a stake from the provided amount

_this method interface matches the original underlying token contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| newStakedHearts | uint256 | amount of tokens to stake |
| newStakedDays | uint256 | the number of days for this new stake |

### stakeEnd

```solidity
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external
```

end your own stake which is custodied by the stake manager. skips tip computing
this is not payable to match the underlying contract
this moves funds back to the sender to make behavior match underlying token
this method only checks that the sender owns the stake it does not care
if it is managed in a created contract and externally endable by this contract (1)
or requires that the staker send start and end methods (0)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIndex | uint256 | the index on the underlying contract to end stake |
| stakeId | uint40 | the stake id from the underlying contract to end stake |

### stakeGoodAccounting

```solidity
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakerAddr | address | the custoidan of the stake |
| stakeIndex | uint256 | the index of the stake in question |
| stakeIdParam | uint40 | the id of the stake |

### stakeCount

```solidity
function stakeCount(address staker) external view returns (uint256 count)
```

the count of stakes for a given custodian / staker

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| staker | address | the custodian in question |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| count | uint256 | of the stakes under a given custodian / staker |

### globalInfo

```solidity
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex)
updated at the first start or end stake on any given day

### stakeLists

```solidity
function stakeLists(address staker, uint256 index) external view returns (struct IUnderlyingStakeable.StakeStore)
```

retrieve a stake at a staker's index given a staker address and an index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| staker | address | the staker in question |
| index | uint256 | the index to focus on |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUnderlyingStakeable.StakeStore | stake the stake custodied by a given staker at a given index |

### currentDay

```solidity
function currentDay() external view returns (uint256)
```

retrieve the current day from the target contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | day the current day according to the hex contract |

