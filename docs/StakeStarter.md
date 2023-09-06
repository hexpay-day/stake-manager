# Solidity API

## StakeStarter

### stakeStartFromBalanceFor

```solidity
function stakeStartFromBalanceFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

stake a given number of tokens for a given number of days

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | the address that will own the staker |
| amount | uint256 | the number of tokens to stake |
| newStakedDays | uint256 | the number of days to stake for |
| settings | uint256 |  |

### stakeStartFromWithdrawableFor

```solidity
function stakeStartFromWithdrawableFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

start a numbeer of stakes for an address from the withdrawable

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | the account to start a stake for |
| amount | uint256 | the number of tokens to start a stake for |
| newStakedDays | uint256 | the number of days to stake for |
| settings | uint256 |  |

### stakeStartFromUnattributedFor

```solidity
function stakeStartFromUnattributedFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

stake a number of tokens for a given number of days, pulling from
the unattributed tokens in this contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | the owner of the stake |
| amount | uint256 | the amount of tokens to stake |
| newStakedDays | uint256 | the number of days to stake |
| settings | uint256 |  |

