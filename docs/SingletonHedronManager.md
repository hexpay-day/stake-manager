# Solidity API

## SingletonHedronManager

### createTo

```solidity
function createTo(uint256 setting, address owner) external pure returns (uint256 to)
```

### _createTo

```solidity
function _createTo(uint256 setting, address owner) internal pure returns (uint256 to)
```

### mintHedronRewards

```solidity
function mintHedronRewards(uint256[] stakeIds) external
```

mint rewards and transfer them to a provided address
any combination of owners can be passed, however, it is most efficient to order the hsi address by owner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIds | uint256[] | list of stake ids to mint |

### _mintHedron

```solidity
function _mintHedron(uint256 index, uint256 stakeId) internal virtual returns (uint256 amount)
```

