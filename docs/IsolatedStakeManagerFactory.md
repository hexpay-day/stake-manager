# Solidity API

## IsolatedStakeManagerFactory

### CreateIsolatedStakeManager

```solidity
event CreateIsolatedStakeManager(address owner, address instance)
```

### isolatedStakeManagers

```solidity
mapping(address => address) isolatedStakeManagers
```

a mapping of a key that contains a modifier and the owning address
pointing to the address of the contract created by the stake manager

### createIsolatedManager

```solidity
function createIsolatedManager(address staker) external returns (address existing)
```

