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

### MAX_256

```solidity
uint256 MAX_256
```

### tipStakeIdToStaker

```solidity
mapping(uint256 => address) tipStakeIdToStaker
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
event Tip(uint256 stakeId, address staker, address token, uint256 amount)
```

tip an address a defined amount and token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id being targeted |
| staker | address | the staker |
| token | address | the token being accounted |
| amount | uint256 | the amount of the token |

### stakeIdTips

```solidity
mapping(uint256 => uint256[]) stakeIdTips
```

### stakeIdTipSize

```solidity
function stakeIdTipSize(uint256 stakeId) external view returns (uint256)
```

### _stakeIdTipSize

```solidity
function _stakeIdTipSize(uint256 stakeId) internal view returns (uint256)
```

### _executeTipList

```solidity
function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId) internal
```

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

### removeTipFromStake

```solidity
function removeTipFromStake(uint256 stakeId, uint256[] indexes) external payable
```

### _removeTipFromStake

```solidity
function _removeTipFromStake(uint256 stakeId, uint256[] indexes) internal
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

### _addTipToStake

```solidity
function _addTipToStake(bool reusable, address token, address account, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) internal returns (uint256 index, uint256 tipAmount)
```

### receive

```solidity
receive() external payable
```

