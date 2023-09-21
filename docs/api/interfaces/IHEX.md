
## IHEX

### XfLobbyEnter

```solidity
event XfLobbyEnter(uint256 data0, address memberAddr, uint256 entryId, address referrerAddr)
```

### XfLobbyExit

```solidity
event XfLobbyExit(uint256 data0, address memberAddr, uint256 entryId, address referrerAddr)
```

### DailyDataUpdate

```solidity
event DailyDataUpdate(uint256 data0, address updaterAddr)
```

### Claim

```solidity
event Claim(uint256 data0, uint256 data1, bytes20 btcAddr, address claimToAddr, address referrerAddr)
```

### ClaimAssist

```solidity
event ClaimAssist(uint256 data0, uint256 data1, uint256 data2, address senderAddr)
```

### StakeStart

```solidity
event StakeStart(uint256 data0, address stakerAddr, uint40 stakeId)
```

### StakeGoodAccounting

```solidity
event StakeGoodAccounting(uint256 data0, uint256 data1, address stakerAddr, uint40 stakeId, address senderAddr)
```

### StakeEnd

```solidity
event StakeEnd(uint256 data0, uint256 data1, address stakerAddr, uint40 stakeId)
```

### ShareRateChange

```solidity
event ShareRateChange(uint256 data0, uint40 stakeId)
```

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

### globalInfo

```solidity
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex)
updated at the first start or end stake on any given day

### dailyData

```solidity
function dailyData(uint256 day) external view returns (uint72 dayPayoutTotal, uint72 dayStakeSharesTotal, uint56 dayUnclaimedSatoshisTotal)
```

### dailyDataRange

```solidity
function dailyDataRange(uint256 beginDay, uint256 endDay) external view returns (uint256[] list)
```

