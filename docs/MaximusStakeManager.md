# Solidity API

## MaximusStakeManager

### externalPerpetualSetter

```solidity
address externalPerpetualSetter
```

### externalPerpetualFilter

```solidity
address externalPerpetualFilter
```

### perpetualWhitelist

```solidity
mapping(address => bool) perpetualWhitelist
```

### rewardsTo

```solidity
mapping(address => mapping(uint256 => address)) rewardsTo
```

bytes32 is a key made up of the perpetual whitelist address + the iteration of the stake found at

### AddPerpetual

```solidity
event AddPerpetual(address perpetual)
```

emitted when a contract is added to the whitelist

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the perpetual contract added to the whitelist |

### CollectReward

```solidity
event CollectReward(address perpetual, uint256 period, address token, uint256 amount)
```

collect a reward from a given perpetual within a period

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the perpetual contract being targeted |
| period | uint256 | the period, managed internally by the perpetual |
| token | address | the token being rewarded |
| amount | uint256 | the amount of a token being rewarded |

### DistributeReward

```solidity
event DistributeReward(address perpetual, uint256 period, address token, uint256 amount)
```

notes that a reward is being distributed to a given address,
which previously ended a perpetual contract's stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the address of the perpetual contract |
| period | uint256 | the period being rewarded |
| token | address | the token being rewarded |
| amount | uint256 | the amount of the token being rewarded |

### constructor

```solidity
constructor() public
```

a list of known perpetual contracts is set during constructor

### setExternalPerpetualFilter

```solidity
function setExternalPerpetualFilter(address _externalPerpetualFilter) external
```

sets the extended perpetual filter to allow for other perpetual contracts
to pass through the filter and added at a later date

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _externalPerpetualFilter | address | the extended perpetual filter set by the creator of this contract |

### checkPerpetual

```solidity
function checkPerpetual(address perpetual) external returns (bool isPerpetual)
```

check if a given contract can pass through the perpetual filter

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the perpetual contract to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isPerpetual | bool | when address has passed through the filter or extended filter |

### _checkPerpetual

```solidity
function _checkPerpetual(address perpetual) internal returns (bool isPerpetual)
```

check if a given contract can pass through the perpetual filter

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the perpetual contract to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isPerpetual | bool | when address has passed through the filter or extended filter after passing through extended filter, the result is cached |

### _addPerpetual

```solidity
function _addPerpetual(address perpetual) internal
```

adds new perpetual contract to the whitelist
Once a perpetual is whitelisted it cannot be removed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| perpetual | address | the perpetual address to add to the persistant mapping |

### stakeEndAs

```solidity
function stakeEndAs(address rewarded, address perpetual, uint256 stakeId) external
```

end a stake on a known perpetual

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| rewarded | address | the address to reward with tokens |
| perpetual | address | the perpetual to end a stake on |
| stakeId | uint256 | the stake id to end |

### _checkEndable

```solidity
function _checkEndable(contract IPublicEndStakeable endable) internal view returns (bool isEndable)
```

checks if a given perpetual is endable

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| endable | contract IPublicEndStakeable | the endable perpetual contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isEndable | bool | denotes whether or not the stake is endable |

### checkEndable

```solidity
function checkEndable(address endable) external view returns (bool isEndable)
```

checks if a given perpetual is endable

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| endable | address | the endable perpetual contract |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| isEndable | bool | verifies that the provided address is endable |

### flush

```solidity
function flush(address gasReimberser, address perpetual, uint256 period, address[] tokens) external
```

flush erc20 tokens into this contract
this assumes that only one token is flushed at a time
accounting will be lost if this patterns is broken by distribution tokens
or perpetual sending more than one token at a time

_this method should not be chained to a stake end - it should be done in a separate transaction_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| gasReimberser | address | the address to collect gas reimbersement from |
| perpetual | address | the perpetual pool to call flush on |
| period | uint256 | the period that the token collects against |
| tokens | address[] | the token addresses to flush into this contract |

