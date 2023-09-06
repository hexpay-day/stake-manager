# Solidity API

## Magnitude

### MULTIPLIER

```solidity
uint256 MULTIPLIER
```

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
function _computeMagnitude(uint256 limit, uint256 method, uint256 x, uint256 y2, uint256 y1) internal pure returns (uint256 amount)
```

compute a useful value from 2 inputs
funds may never be linked to x variable. X should only hold data that we can plug into
an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 |  |
| method | uint256 | the method to use to compute a result |
| x | uint256 | a primary magnitude to use - a constant held in settings - max value (2^64)-1 |
| y2 | uint256 | a secondary magnitude to use - generally the amount of the end stake |
| y1 | uint256 | the starting point of y2 used for deltas |

### _yDeltas

```solidity
function _yDeltas(uint256 method, uint256 y2, uint256 y1) internal pure returns (uint256 y)
```

### encodeLinear

```solidity
function encodeLinear(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) external pure returns (uint256 encodedMethod, uint256 encodedMagnitude)
```

### _encodeLinear

```solidity
function _encodeLinear(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) internal pure returns (uint256 encodedMethod, uint256 encodedMagnitude)
```

convert an x/y+b line into a number held in under 72 total bits

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| method | uint256 | the method to use (total, principle, yield) when choosing x |
| xFactor | uint256 | the scaling factor of x |
| x | int256 | the x value to use, which will multiply against input |
| yFactor | uint256 | the scaling factor of y |
| y | uint256 | the y value to use to divide x*input |
| bFactor | uint256 | the scaling factor of b |
| b | int256 | the y intercept |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| encodedMethod | uint256 | the encoded method which can be further encoded using settings uint8 |
| encodedMagnitude | uint256 | the encoded numbers describing (x/y)+b |

### decodeLinear

```solidity
function decodeLinear(uint256 method, uint256 magnitude) external pure returns (int256 x, uint256 y, int256 b)
```

decode an b+(x/y) slope from a number and scale it to your preference
this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| method | uint256 | scales the y intercept |
| magnitude | uint256 | the uint256 number to decode into b+(x/y) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | the rise of the line |
| y | uint256 | the run of the line |
| b | int256 | the offset of the line |

### _decodeLinear

```solidity
function _decodeLinear(uint256 method, uint256 magnitude) internal pure returns (int256 x, uint256 y, int256 b)
```

decodes an embeded xy+b equation from encoded method and magnitude

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| method | uint256 | the factor to raise a constant multipler to expand the b value. |
| magnitude | uint256 | an encoded number with b,x,y each uint16 prefixed by scales in uint8 |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | the run that a value will be multiplied by |
| y | uint256 | the rise that a value can be divided by |
| b | int256 | an offset or y intercept that can displace the ((x+b)/y) in a positive or negative direction |

### computeMagnitude

```solidity
function computeMagnitude(uint256 limit, uint256 method, uint256 x, uint256 y2, uint256 y1) external pure returns (uint256 result)
```

compute a magnitude given an x and y

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| limit | uint256 | a limit that the uint result can not be greater than |
| method | uint256 | the method to use to compute the result |
| x | uint256 | the first value as input |
| y2 | uint256 | the second value as input |
| y1 | uint256 | the stake to use as an input for the second value |

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

