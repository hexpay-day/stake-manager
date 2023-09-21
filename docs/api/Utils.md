
## Utils

### NotAllowed

```solidity
error NotAllowed()
```

### TARGET

```solidity
address TARGET
```

### MAX_DAYS

```solidity
uint256 MAX_DAYS
```

### MAX_256

```solidity
uint256 MAX_256
```

### SLOTS

```solidity
uint256 SLOTS
```

### TEN_K

```solidity
uint256 TEN_K
```

### ADDRESS_BIT_LENGTH

```solidity
uint256 ADDRESS_BIT_LENGTH
```

### MIN_INT_16

```solidity
int256 MIN_INT_16
```

### MAX_UINT8

```solidity
uint256 MAX_UINT8
```

### ZERO

```solidity
uint256 ZERO
```

### ONE

```solidity
uint256 ONE
```

### TWO

```solidity
uint256 TWO
```

### THREE

```solidity
uint256 THREE
```

### FOUR

```solidity
uint256 FOUR
```

### EIGHT

```solidity
uint256 EIGHT
```

### SIXTEEN

```solidity
uint256 SIXTEEN
```

### TWENTY_FOUR

```solidity
uint256 TWENTY_FOUR
```

### THIRTY_TWO

```solidity
uint256 THIRTY_TWO
```

### FOURTY

```solidity
uint256 FOURTY
```

### FOURTY_EIGHT

```solidity
uint256 FOURTY_EIGHT
```

### FIFTY_SIX

```solidity
uint256 FIFTY_SIX
```

### SIXTY_FOUR

```solidity
uint256 SIXTY_FOUR
```

### SEVENTY_TWO

```solidity
uint256 SEVENTY_TWO
```

### HEDRON

```solidity
address HEDRON
```

### HSIM

```solidity
address HSIM
```

### isOneAtIndex

```solidity
function isOneAtIndex(uint256 setting, uint256 index) external pure returns (bool)
```

check if the number, in binary form, has a 1 at the provided index

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| setting | uint256 | the setting number that holds up to 256 flags as 1/0 |
| index | uint256 | the index to check for a 1 |

### _isOneAtIndex

```solidity
function _isOneAtIndex(uint256 setting, uint256 index) internal pure returns (bool)
```

### _bubbleRevert

```solidity
function _bubbleRevert(bytes data) internal pure
```

after an error is caught, it can be reverted again

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | the data to repackage and revert with |

