# Solidity API

## CurrencyList

### AddCurrency

```solidity
event AddCurrency(address token, uint256 index)
```

### indexToToken

```solidity
address[] indexToToken
```

### currencyToIndex

```solidity
mapping(address => uint256) currencyToIndex
```

### addCurrencyToList

```solidity
function addCurrencyToList(address token) external returns (uint256)
```

creates a registry of tokens to map addresses that stakes will tip in
to numbers so that they can fit in a single byteword,
reducing costs when tips in the same currency occur

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to add to the list of tippable tokens |

### _addCurrencyToList

```solidity
function _addCurrencyToList(address token) internal returns (uint256)
```

adds a hash to a list and mapping to fit them in smaller sload counts

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the token to add to the internally tracked list and mapping |

### currencyListSize

```solidity
function currencyListSize() external view returns (uint256)
```

