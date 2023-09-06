# Solidity API

## EarningsOracle

### lastZeroDay

```solidity
uint256 lastZeroDay
```

### MAX_CATCH_UP_DAYS

```solidity
uint256 MAX_CATCH_UP_DAYS
```

_this max constraint is very generous given that
the sstore opcode costs ~20k gas at the time of writing_

### MAX_UINT_128

```solidity
uint256 MAX_UINT_128
```

### SHARE_SCALE

```solidity
uint256 SHARE_SCALE
```

### totals

```solidity
struct EarningsOracle.TotalStore[] totals
```

### TotalStore

```solidity
struct TotalStore {
  uint128 payout;
  uint128 shares;
}
```

### Total

```solidity
struct Total {
  uint256 payout;
  uint256 shares;
}
```

### constructor

```solidity
constructor(uint256 _lastZeroDay, uint256 untilDay) public
```

deploy contract and start collecting data immediately.
pass 0 for untilDay arg to skip collection and start with nothing in payoutTotal array

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _lastZeroDay | uint256 | the final day to allow zero value (used to filter out empty values) |
| untilDay | uint256 | the day to end collection |

### totalsCount

```solidity
function totalsCount() external view returns (uint256 count)
```

the size of the payoutTotal array - correlates to days stored

### payoutDelta

```solidity
function payoutDelta(uint256 startDay, uint256 untilDay) external view returns (uint256 payout, uint256 shares)
```

the delta between two days. untilDay argument must be greater
than startDay argument otherwise call may fail

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startDay | uint256 | the day to start counting from |
| untilDay | uint256 | the day to end with (inclusive) |

### payoutDeltaTrucated

```solidity
function payoutDeltaTrucated(uint256 startDay, uint256 untilDay, uint256 multiplier) external view returns (uint256 payout)
```

multiply the difference of the payout by a constant and divide that result by the denominator
subtract half of the difference between the two days to find the possible lower bound

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startDay | uint256 | the day to start counting |
| untilDay | uint256 | the day to stop counting |
| multiplier | uint256 | a number to multiply by the difference of the payout |

### _storeDay

```solidity
function _storeDay(uint256 day, struct EarningsOracle.Total _total) internal returns (struct EarningsOracle.Total total)
```

store the payout total for a given day. day must be the next day in the sequence (start with 0)
day must have data available to read from the hex contract

_the _total arg must be handled internally - cannot be passed from external_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| day | uint256 | the day being targeted |
| _total | struct EarningsOracle.Total |  |

### _readTotals

```solidity
function _readTotals(uint256 day, struct EarningsOracle.Total _total) internal view returns (uint256 payout, uint256 shares)
```

### _saveDay

```solidity
function _saveDay(uint256 payout, uint256 shares) internal returns (struct EarningsOracle.Total total)
```

### storeDay

```solidity
function storeDay(uint256 day) external returns (struct EarningsOracle.Total total)
```

store a singular day, only the next day in the sequence is allowed

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| day | uint256 | the day to store |

### incrementDay

```solidity
function incrementDay() external returns (struct EarningsOracle.Total total, uint256 day)
```

checks the current day and increments the stored days if not yet covered

### _storeDays

```solidity
function _storeDays(uint256 startDay, uint256 untilDay) internal returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. untilDay is exclusive unless startDay and untilDay match

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startDay | uint256 | the day to start storing day information |
| untilDay | uint256 | the day to stop storing day information |

### storeDays

```solidity
function storeDays(uint256 startDay, uint256 untilDay) external returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. range is not constrained by max catch up days constant
nor is it constrained to the current day so if it goes beyond the current day or has not yet been stored
then it is subject to failure

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| startDay | uint256 | the day to start storing day information |
| untilDay | uint256 | the day to stop storing day information. Until day is inclusive |

### catchUpDays

```solidity
function catchUpDays(uint256 iterations) external returns (struct EarningsOracle.Total total, uint256 day)
```

catch up the contract by reading up to 1_000 days of payout information at a time

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| iterations | uint256 | the maximum number of days to iterate over - capped at 1_000 due to sload constraints |

### _validateTotals

```solidity
function _validateTotals(uint256 payout, uint256 shares) internal pure virtual
```

