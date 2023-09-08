# Solidity API

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

### _executeTipList

```solidity
function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId, address tipTo) internal
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
function encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 fullEncodedLinear) external pure returns (uint256)
```

encodes a series of data in 32+96+64+64 to fit into 256 bits to define
how a tip should be executed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| reusable | bool |  |
| currencyIndex | uint256 | the index of the currency on the list |
| amount | uint256 | the number of tokens to delineate as tips |
| fullEncodedLinear | uint256 | the method+xyb function to use |

### encodedLinearWithMethod

```solidity
function encodedLinearWithMethod(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) external pure returns (uint256)
```

### _encodeTipSettings

```solidity
function _encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 fullEncodedLinear) internal pure returns (uint256)
```

### depositAndAddTipToStake

```solidity
function depositAndAddTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) external payable virtual returns (uint256, uint256)
```

### removeAllTips

```solidity
function removeAllTips(uint256 stakeId) external
```

### _removeAllTips

```solidity
function _removeAllTips(uint256 stakeId, uint256 settings) internal
```

### removeTipsFromStake

```solidity
function removeTipsFromStake(uint256 stakeId, uint256[] indexes) external payable
```

### _removeTipsFromStake

```solidity
function _removeTipsFromStake(uint256 stakeId, uint256 settings, uint256[] indexes) internal
```

### addTipToStake

```solidity
function addTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) external payable virtual returns (uint256, uint256)
```

### _verifyTipAmountAllowed

```solidity
function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns (address recipient)
```

### _checkStakeCustodian

```solidity
function _checkStakeCustodian(uint256 stakeId) internal view virtual
```

### _transferTipLock

```solidity
function _transferTipLock(uint256 stakeId, bool force) internal
```

### _addTipToStake

```solidity
function _addTipToStake(bool reusable, address token, address account, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) internal returns (uint256 index, uint256 tipAmount)
```

### receive

```solidity
receive() external payable
```

