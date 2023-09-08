# Solidity API

## TransferReceiver

### StakeReceived

```solidity
event StakeReceived(address sender, uint256 stakeId)
```

### FailedToReceive

```solidity
error FailedToReceive(uint256 stakeId)
```

### _shouldErr

```solidity
uint256 _shouldErr
```

### setReceiveAction

```solidity
function setReceiveAction(uint256 shouldErr) external
```

### onStakeReceived

```solidity
function onStakeReceived(address from, uint256 stakeId) external
```

