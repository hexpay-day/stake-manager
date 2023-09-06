# Solidity API

## Bank

this contract should never owe more than the withdrawableBalanceOf's it has in erc20 terms

### attributed

```solidity
mapping(address => uint256) attributed
```

### withdrawableBalanceOf

```solidity
mapping(address => mapping(address => uint256)) withdrawableBalanceOf
```

### _getUnattributed

```solidity
function _getUnattributed(address token) internal view returns (uint256)
```

gets unattributed tokens floating in the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of the token that you wish to get the unattributed value of |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | a uint representing the amount of tokens that have been deposited into the contract, which are not attributed to any address |

### _getBalance

```solidity
function _getBalance(address token, address owner) internal view returns (uint256)
```

get the balance and ownership of any token

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token address that you wish to get the balance of (including native) |
| owner | address | the owner address to get the balance of |

### getUnattributed

```solidity
function getUnattributed(address token) external view returns (uint256)
```

gets the amount of unattributed tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to get the unattributed balance of |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the amount of a token that can be withdrawn |

### clamp

```solidity
function clamp(uint256 amount, uint256 max) external pure returns (uint256)
```

given a provided input amount, clamp the input to a maximum, using maximum if 0 provided

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the requested or input amount |
| max | uint256 | the maximum amount that the value can be |

### _clamp

```solidity
function _clamp(uint256 amount, uint256 max) internal pure returns (uint256)
```

clamp a given amount to the maximum amount
use the maximum amount if no amount is requested

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| amount | uint256 | the amount requested by another function |
| max | uint256 | the limit that the value can be |

### depositToken

```solidity
function depositToken(address token, uint256 amount) external payable returns (uint256)
```

transfer a given number of tokens to the contract to be used by the contract's methods
an extra layer of protection is provided by this method
and can be refused by calling the dangerous version

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| amount | uint256 | the number of tokens to transfer to the contract |

### depositTokenTo

```solidity
function depositTokenTo(address token, address to, uint256 amount) external payable returns (uint256)
```

deposit an amount of tokens to the contract and attribute
them to the provided address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| to | address | the account to give ownership over tokens |
| amount | uint256 | the amount of tokens |

### _depositTokenTo

```solidity
function _depositTokenTo(address token, address to, uint256 amount) internal returns (uint256)
```

### collectUnattributed

```solidity
function collectUnattributed(address token, bool transferOut, address payable to, uint256 amount) external payable returns (uint256)
```

collect unattributed tokens and send to recipient of choice
when 0 is passed, withdraw maximum available
or in other words, all unattributed tokens

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| transferOut | bool | transfers tokens to the provided address |
| to | address payable | the address to receive or have tokens attributed to |
| amount | uint256 | the requested amount - clamped to the amount unattributed |

### _collectUnattributed

```solidity
function _collectUnattributed(address token, bool transferOut, address payable to, uint256 amount, uint256 max) internal returns (uint256 withdrawable)
```

### collectUnattributedPercent

```solidity
function collectUnattributedPercent(address token, bool transferOut, address payable recipient, uint256 basisPoints) external returns (uint256 amount)
```

collect a number of unattributed tokens as basis points

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token that you wish to collect |
| transferOut | bool | whether to transfer token out |
| recipient | address payable | the recipient of the tokens |
| basisPoints | uint256 | the number of basis points (100% = 10_000) |

### withdrawTokenTo

```solidity
function withdrawTokenTo(address token, address payable to, uint256 amount) external payable returns (uint256)
```

transfer an amount of tokens currently attributed to the withdrawable balance of the sender

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to transfer - uses address(0) for native |
| to | address payable | the to of the funds |
| amount | uint256 | the amount that should be deducted from the sender's balance |

### _getTokenBalance

```solidity
function _getTokenBalance(address token) internal view returns (uint256)
```

### _addToTokenWithdrawable

```solidity
function _addToTokenWithdrawable(address token, address to, uint256 amount) internal
```

adds a balance to the provided staker of the magnitude given in amount

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| to | address | the account to add a withdrawable balance to |
| amount | uint256 | the amount to add to the staker's withdrawable balance as well as the attributed tokens |

### _deductWithdrawable

```solidity
function _deductWithdrawable(address token, address account, uint256 amount) internal returns (uint256)
```

deduce an amount from the provided account
after a deduction, funds could be considered "unattributed"
and if they are left in such a state they could be picked up by anyone else

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| account | address | the account to deduct funds from |
| amount | uint256 | the amount of funds to deduct |

### _depositTokenFrom

```solidity
function _depositTokenFrom(address token, address depositor, uint256 amount) internal returns (uint256 amnt)
```

deposits tokens from a staker and marks them for that staker

### depositTokenUnattributed

```solidity
function depositTokenUnattributed(address token, uint256 amount) external
```

deposit a number of tokens to the contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| amount | uint256 | the number of tokens to deposit |

### _withdrawTokenTo

```solidity
function _withdrawTokenTo(address token, address payable to, uint256 amount) internal returns (uint256)
```

transfers tokens to a recipient

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address |  |
| to | address payable | where to send the tokens |
| amount | uint256 | the number of tokens to send |

### _attributeFunds

```solidity
function _attributeFunds(uint256 setting, uint256 index, address token, address staker, uint256 amount) internal
```

