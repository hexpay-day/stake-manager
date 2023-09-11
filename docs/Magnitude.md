# Solidity API

## Magnitude

### X_OPTIONS

```solidity
uint256 X_OPTIONS
```

### _computeDayMagnitude

```solidity
function _computeDayMagnitude(uint256 limit, uint256 method, uint256 x, uint256 today, uint256 lockedDay, uint256 stakedDays) internal pure returns (uint256 amount)
```

### _computeMagnitude

```solidity
function _computeMagnitude(uint256 limit, uint256 linear, uint256 v2, uint256 v1) internal pure returns (uint256 amount)
```

compute a useful value from 2 inputs
funds may never be linked to x variable. X should only hold data that we can plug into
an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 |  |
| linear | uint256 | holds the linear data to describe how to plot a provied y value |
| v2 | uint256 | a secondary magnitude to use - generally the amount of the end stake |
| v1 | uint256 | the starting point of v2 used for deltas |

### _getDelta

```solidity
function _getDelta(uint256 method, uint256 v2, uint256 v1) internal pure returns (uint256 y)
```

### Linear

```solidity
struct Linear {
  uint256 method;
  uint256 xFactor;
  int256 x;
  uint256 yFactor;
  uint256 y;
  uint256 bFactor;
  int256 b;
}
```

### encodeLinear

```solidity
function encodeLinear(struct Magnitude.Linear linear) external pure returns (uint256 encoded)
```

### _encodeLinear

```solidity
function _encodeLinear(struct Magnitude.Linear linear) internal pure returns (uint256 encoded)
```

convert an x/y+b linear struct into a number held in under 72 total bits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| linear | struct Magnitude.Linear | the struct with all relevant linear data in it |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| encoded | uint256 | the encoded numbers describing (x/y)+b |

### decodeLinear

```solidity
function decodeLinear(uint256 encodedLinear) external pure returns (struct Magnitude.Linear linear)
```

decode an b+(x/y) slope from a number and scale it to your preference
this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encodedLinear | uint256 | holds all relevant data for filling out a Linear struct |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| linear | struct Magnitude.Linear | the full set of parameters to describe a (x/y)+b pattern |

### _decodeLinear

```solidity
function _decodeLinear(uint256 encodedLinear) internal pure returns (struct Magnitude.Linear linear)
```

### computeMagnitude

```solidity
function computeMagnitude(uint256 limit, struct Magnitude.Linear linear, uint256 v2, uint256 v1) external pure returns (uint256 result)
```

compute a magnitude given an x and y

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 | a limit that the uint result can not be greater than |
| linear | struct Magnitude.Linear | the linear data to describe an (x/y)+b relationship |
| v2 | uint256 | the second value as input |
| v1 | uint256 | the stake to use as an input for the second value |

### computeDayMagnitude

```solidity
function computeDayMagnitude(uint256 limit, uint256 method, uint256 x, uint256 today, uint256 lockedDay, uint256 stakedDays) external pure returns (uint256 result)
```

compute a day magnitude given an x and y

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 | a limit that the uint result can not be greater than |
| method | uint256 | the method to use to compute the result |
| x | uint256 | the first value as input |
| today | uint256 | the hex day value |
| lockedDay | uint256 | the day that the stake was locked |
| stakedDays | uint256 | the number of full days that the stake was locked |

