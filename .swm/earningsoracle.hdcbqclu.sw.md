---
id: hdcbqclu
title: EarningsOracle
file_version: 1.1.3
app_version: 1.16.4
---

# Solidity API

## EarningsOracle

### lastZeroDay

```
uint256 lastZeroDay
```

### MAX\_CATCH\_UP\_DAYS

```
uint256 MAX_CATCH_UP_DAYS
```

_this max constraint is very generous given that the sstore opcode costs ~20k gas at the time of writing_

### MAX\_UINT\_128

```
uint256 MAX_UINT_128
```

### SHARE\_SCALE

```
uint256 SHARE_SCALE
```

### totals

```
struct EarningsOracle.TotalStore[] totals
```

### TotalStore

```
struct TotalStore {
  uint128 payout;
  uint128 shares;
}
```

### Total

```
struct Total {
  uint256 payout;
  uint256 shares;
}
```

### constructor

```
constructor(uint256 _lastZeroDay, uint256 untilDay) public
```

deploy contract and start collecting data immediately. pass 0 for untilDay arg to skip collection and start with nothing in payoutTotal array

#### Parameters

<br/>

|Name         |Type   |Description                                                        |
|-------------|-------|-------------------------------------------------------------------|
|\_lastZeroDay|uint256|the final day to allow zero value (used to filter out empty values)|
|untilDay     |uint256|the day to end collection                                          |

<br/>

### totalsCount

```
function totalsCount() external view returns (uint256 count)
```

the size of the payoutTotal array - correlates to days stored

### payoutDelta

```
function payoutDelta(uint256 startDay, uint256 untilDay) external view returns (uint256 payout, uint256 shares)
```

the delta between two days. untilDay argument must be greater than startDay argument otherwise call may fail

#### Parameters

<br/>

|Name    |Type   |Description                    |
|--------|-------|-------------------------------|
|startDay|uint256|the day to start counting from |
|untilDay|uint256|the day to end with (inclusive)|

<br/>

### payoutDeltaTrucated

```
function payoutDeltaTrucated(uint256 startDay, uint256 untilDay, uint256 multiplier) external view returns (uint256 payout)
```

multiply the difference of the payout by a constant and divide that result by the denominator subtract half of the difference between the two days to find the possible lower bound

#### Parameters

<br/>

|Name      |Type   |Description                                         |
|----------|-------|----------------------------------------------------|
|startDay  |uint256|the day to start counting                           |
|untilDay  |uint256|the day to stop counting                            |
|multiplier|uint256|a number to multiply by the difference of the payout|

<br/>

### \_storeDay

```
function _storeDay(uint256 day, struct EarningsOracle.Total _total) internal returns (struct EarningsOracle.Total total)
```

store the payout total for a given day. day must be the next day in the sequence (start with 0) day must have data available to read from the hex contract

\_the _total arg must be handled internally - cannot be passed from external_

#### Parameters

<br/>

|Name   |Type                       |Description           |
|-------|---------------------------|----------------------|
|day    |uint256                    |the day being targeted|
|\_total|struct EarningsOracle.Total|<br/>                 |

<br/>

### \_readTotals

```
function _readTotals(uint256 day, struct EarningsOracle.Total _total) internal view returns (uint256 payout, uint256 shares)
```

### \_saveDay

```
function _saveDay(uint256 payout, uint256 shares) internal returns (struct EarningsOracle.Total total)
```

### storeDay

```
function storeDay(uint256 day) external returns (struct EarningsOracle.Total total)
```

store a singular day, only the next day in the sequence is allowed

#### Parameters

<br/>

|Name|Type   |Description     |
|----|-------|----------------|
|day |uint256|the day to store|

<br/>

### incrementDay

```
function incrementDay() external returns (struct EarningsOracle.Total total, uint256 day)
```

checks the current day and increments the stored days if not yet covered

### \_storeDays

```
function _storeDays(uint256 startDay, uint256 untilDay) internal returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. untilDay is exclusive unless startDay and untilDay match

#### Parameters

<br/>

|Name    |Type   |Description                             |
|--------|-------|----------------------------------------|
|startDay|uint256|the day to start storing day information|
|untilDay|uint256|the day to stop storing day information |

<br/>

### storeDays

```
function storeDays(uint256 startDay, uint256 untilDay) external returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. range is not constrained by max catch up days constant nor is it constrained to the current day so if it goes beyond the current day or has not yet been stored then it is subject to failure

#### Parameters

<br/>

|Name    |Type   |Description                                                    |
|--------|-------|---------------------------------------------------------------|
|startDay|uint256|the day to start storing day information                       |
|untilDay|uint256|the day to stop storing day information. Until day is inclusive|

<br/>

### catchUpDays

```
function catchUpDays(uint256 iterations) external returns (struct EarningsOracle.Total total, uint256 day)
```

catch up the contract by reading up to 1\_000 days of payout information at a time

#### Parameters

<br/>

|Name      |Type   |Description                                                                           |
|----------|-------|--------------------------------------------------------------------------------------|
|iterations|uint256|the maximum number of days to iterate over - capped at 1\_000 due to sload constraints|

<br/>

### \_validateTotals

```
function _validateTotals(uint256 payout, uint256 shares) internal pure virtual
```

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBc3Rha2UtbWFuYWdlciUzQSUzQWhleHBheS1kYXk=/docs/hdcbqclu).
