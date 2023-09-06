# Solidity API

## UnderlyingStakeManager

### _stakeStartFor

```solidity
function _stakeStartFor(address owner, uint256 amount, uint256 newStakedDays, uint256 index) internal virtual returns (uint256 stakeId)
```

start a stake for the staker given the amount and number of days

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the underlying owner of the stake |
| amount | uint256 | the amount to add to the stake |
| newStakedDays | uint256 | the number of days that the stake should run |
| index | uint256 | where in the list the stake will be placed. this is a param because it can be cached for internal loops |

### _stakeEnd

```solidity
function _stakeEnd(uint256 stakeIndex, uint256 stakeId, uint256 stakeCountAfter) internal virtual returns (uint256 delta)
```

ends a stake for someone else

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIndex | uint256 | the stake index on the underlying contract to end |
| stakeId | uint256 | the stake id on the underlying contract to end |
| stakeCountAfter | uint256 | the stake count after the stake is ended (current length - 1) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| delta | uint256 | the number of tokens that have been received from ending the stake |

### stakeStart

```solidity
function stakeStart(uint256 amount, uint256 newStakedDays) external virtual
```

starts a stake from the provided amount

_this method interface matches the original underlying token contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | amount of tokens to stake |
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

### _stakeEndByIndexAndId

```solidity
function _stakeEndByIndexAndId(uint256 stakeIndex, uint256 stakeId) internal virtual returns (uint256 amount)
```

### stakeEndById

```solidity
function stakeEndById(uint256 stakeId) external virtual returns (uint256 amount)
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
| stakeId | uint256 | the stake id from the underlying contract to end stake |

### _stakeRestartById

```solidity
function _stakeRestartById(uint256 stakeId) internal returns (uint256 amount, uint256 newStakeId)
```

given ownership over a stake, end the stake
and restart all of the proceeds

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to restart |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount ended and re-staked |
| newStakeId | uint256 | the newly recreated stake id |

### stakeRestartById

```solidity
function stakeRestartById(uint256 stakeId) external returns (uint256 amount, uint256 newStakeId)
```

given ownership over a stake, stop and restart a stake with all proceeds

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to restart |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the number of tokens that were ended and added to new stake |
| newStakeId | uint256 | the newly created stake id |

### stakeRestartManyById

```solidity
function stakeRestartManyById(uint256[] stakeIds) external
```

given ownership over a list of ids of stakes, restart a list of stakes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIds | uint256[] | the list of stake ids to iterate over and restart |

