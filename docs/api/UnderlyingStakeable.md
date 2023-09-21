
## UnderlyingStakeable

### _getStake

```solidity
function _getStake(address custodian, uint256 index) internal view virtual returns (struct IUnderlyingStakeable.StakeStore)
```

gets the stake store at the provided index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| custodian | address | the custodian (usually this) whose list to check |
| index | uint256 | the index of the stake to get |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct IUnderlyingStakeable.StakeStore | the stake on the list at the provided index |

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

### _stakeCount

```solidity
function _stakeCount(address staker) internal view returns (uint256 count)
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

### balanceOf

```solidity
function balanceOf(address owner) external view returns (uint256 amount)
```

retrieve the balance of a given owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the tokens |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | a balance amount |

### _balanceOf

```solidity
function _balanceOf(address owner) internal view returns (uint256 amount)
```

retrieve the balance of a given owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the owner of the tokens |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | a balance amount |

### stakeLists

```solidity
function stakeLists(address staker, uint256 index) external view returns (struct IUnderlyingStakeable.StakeStore stake)
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
| stake | struct IUnderlyingStakeable.StakeStore | the stake custodied by a given staker at a given index |

### currentDay

```solidity
function currentDay() external view returns (uint256 day)
```

retrieve the current day from the target contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| day | uint256 | the current day according to the hex contract |

### _currentDay

```solidity
function _currentDay() internal view returns (uint256)
```

retrieve the current day from the target contract

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | day the current day according to the hex contract |

### globalInfo

```solidity
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex)
updated at the first start or end stake on any given day

### isEarlyEnding

```solidity
function isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) external pure returns (bool isEarly)
```

check whether or not the stake is being ended early

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockedDay | uint256 | the day after the stake was locked |
| stakedDays | uint256 | the number of days that the stake is locked |
| targetDay | uint256 | the day to check whether it will be categorized as ending early |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isEarly | bool | the locked and staked days are greater than the target day (usually today) |

### _isEarlyEnding

```solidity
function _isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) internal pure returns (bool isEarly)
```

check whether or not the stake is being ended early

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| lockedDay | uint256 | the day after the stake was locked |
| stakedDays | uint256 | the number of days that the stake is locked |
| targetDay | uint256 | the day to check whether it will be categorized as ending early |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isEarly | bool | the locked and staked days are greater than the target day (usually today) |

### stakeStart

```solidity
function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external virtual
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
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external virtual
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
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external virtual
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakerAddr | address | the custoidan of the stake |
| stakeIndex | uint256 | the index of the stake in question |
| stakeIdParam | uint40 | the id of the stake |

