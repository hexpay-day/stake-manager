
## Tipper

### INDEX_EXTERNAL_TIP_CURRENCY

```solidity
uint256 INDEX_EXTERNAL_TIP_CURRENCY
```

### INDEX_EXTERNAL_TIP_CURRENCY_ONLY

```solidity
uint256 INDEX_EXTERNAL_TIP_CURRENCY_ONLY
```

### INDEX_EXTERNAL_TIP_LIMIT

```solidity
uint256 INDEX_EXTERNAL_TIP_LIMIT
```

### INDEX_EXTERNAL_TIP_METHOD

```solidity
uint256 INDEX_EXTERNAL_TIP_METHOD
```

### constructor

```solidity
constructor() internal
```

### tipStakeIdToStaker

```solidity
mapping(uint256 => address) tipStakeIdToStaker
```

_this mapping is needed for the case where a tip is added to a stake
but the staker ends the stake on a lower level which never checks for tips
this mapping slightly increases the cost of initializing tips as well as transferring them
but that is ok, because we generally do not want people to be trading stakes at this level
of anyone wants to be swapping ownership over stakes then they can create
an erc721 and trade at a higher level
also end stakers get a larger refund due to more information being zero'd out
it is set to internal because, generally, the stake id should be going
to the lower level `stakeIdInfo` mapping and individuals who do not wish to tip
should not be charged 2k gas for checking if this mapping exists_

### stakeIdTips

```solidity
mapping(uint256 => uint256[]) stakeIdTips
```

### AddTip

```solidity
event AddTip(uint256 stakeId, address token, uint256 index, uint256 setting)
```

### RemoveTip

```solidity
event RemoveTip(uint256 stakeId, address token, uint256 index, uint256 setting)
```

### Tip

```solidity
event Tip(uint256 stakeId, address token, address to, uint256 amount)
```

tip an address a defined amount and token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id being targeted |
| token | address | the token being accounted |
| to | address | the address to attribute rewards to |
| amount | uint256 | the amount of the token |

### stakeIdTipSize

```solidity
function stakeIdTipSize(uint256 stakeId) external view returns (uint256)
```

check the count of a list of tips provided by the staker

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check the list of tips |

### _stakeIdTipSize

```solidity
function _stakeIdTipSize(uint256 stakeId) internal view returns (uint256)
```

check the count of a list of tips provided by the staker

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check the list of tips |

### computeTip

```solidity
function computeTip(uint256 tip) external view returns (uint256 limit, uint256 consumed)
```

### _computeTip

```solidity
function _computeTip(uint256 tip) internal view returns (uint256 limit, uint256 consumed)
```

### _executeTipList

```solidity
function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId, address tipTo) internal returns (uint256 nextStakeTipsLength)
```

execute a list of tips and leave them in the unattributed space

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id whose tips should be executed |
| staker | address | the staker that owns the stake id |
| nextStakeId | uint256 | the next stake id if tips are to be copied / rolled over |
| tipTo | address |  |

### encodeTipSettings

```solidity
function encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 encodedLinear) external pure returns (uint256)
```

encodes a series of data in 32+96+64+64 to fit into 256 bits to define
how a tip should be executed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool |  |
| currencyIndex | uint256 | the index of the currency on the list |
| amount | uint256 | the number of tokens to delineate as tips |
| encodedLinear | uint256 | the method+xyb function to use |

### _encodeTipSettings

```solidity
function _encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 encodedLinear) internal pure returns (uint256)
```

encodes tip settings into a uint256

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool | the tip can be reused if there is amount left over |
| currencyIndex | uint256 | the index of the currency on the list |
| amount | uint256 | the number of tokens deposited into the contract |
| encodedLinear | uint256 | an (x/y)+b equation inside of uint72 |

### depositAndAddTipToStake

```solidity
function depositAndAddTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 encodedLinear) external payable virtual returns (uint256, uint256)
```

create a tip and back it with a token, to be executed by the stake ender

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool | the tip can be reused if value is still present after it has been executed |
| token | address | the token to fund the tip |
| stakeId | uint256 | the stake id that the tip belongs to |
| amount | uint256 | the number of tokens to back the tip with use zero to move all withdrawableBalanceOf value |
| encodedLinear | uint256 | the (x/y)+b equation to define how much of the tip to spend |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | index of the tip in the list |
| [1] | uint256 | tipAmount the final backing value of the tip |

### removeAllTips

```solidity
function removeAllTips(uint256 stakeId) external
```

remove all tips from a stake id and moves them to the
withdrawableBalanceOf the owner of the stake

_if the sender does not own the stake id, the call will fail_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to remove all tips from |

### _removeAllTips

```solidity
function _removeAllTips(uint256 stakeId, uint256 settings) internal
```

remove all tips from a stake id and moves them to the
withdrawableBalanceOf the owner of the stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to remove all tips from |
| settings | uint256 | the settings of the stake used for determining whether or not to send funds back to staker |

### removeTipsFromStake

```solidity
function removeTipsFromStake(uint256 stakeId, uint256[] indexes) external payable
```

remove a list of tip indexes from a given stake

_notice that the list of stakes will be mutated as each tip is removed
so you will have to calculate off chain where tips will move to or provide a list
such as [0, 0, 0] or decrementing [5,4,3,2,1,0] that will not be affected by the list mutating_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to remove tips from |
| indexes | uint256[] | the list of indexes of tips to be removed from the list |

### _removeTipsFromStake

```solidity
function _removeTipsFromStake(uint256 stakeId, uint256 settings, uint256[] indexes) internal
```

### addTipToStake

```solidity
function addTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 encodedLinear) external payable virtual returns (uint256, uint256)
```

create and back a tip with a given number of tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool | the tip is reusable |
| token | address | the token to use in the tip |
| stakeId | uint256 | the stake id to attribute the tip to |
| amount | uint256 | the number of tokens to tip |
| encodedLinear | uint256 | the (x/y)+b equation to use for determining the magnitude of the tip |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the index of the tip in the list |
| [1] | uint256 | the final tip amount |

### _verifyTipAmountAllowed

```solidity
function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns (address recipient)
```

verify that the inputs of the tip are allowed and will
not conflict with downstream requirements

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to verify |
| amount | uint256 | the amount to verify. notice that zero cannot be used unless the sender owns the stake. this is to prevent addresses from taking other accounts funding |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| recipient | address | who will be the effective owner of the tip |

### _checkStakeCustodian

```solidity
function _checkStakeCustodian(uint256 stakeId) internal view virtual
```

check that this contract is custodian of the given stake id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check that this address is the custodian |

### _addTipToStake

```solidity
function _addTipToStake(bool reusable, address token, address account, uint256 stakeId, uint256 amount, uint256 encodedLinear) internal returns (uint256 index, uint256 tipAmount)
```

create a tip and back it with given tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool | the tip should be reused if it is not consumed during execution |
| token | address | the token that is backing the tips value |
| account | address | the account that is providing the tokens |
| stakeId | uint256 | the stake id to point the tip to |
| amount | uint256 | the number of tokens to back the tip |
| encodedLinear | uint256 | the (x/y)+b equation |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | the index of the tip in the tips list |
| tipAmount | uint256 | the amount of tokens added to the tip |

### receive

```solidity
receive() external payable
```

