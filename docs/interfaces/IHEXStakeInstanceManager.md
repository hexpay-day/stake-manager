# Solidity API

## IHEXStakeInstanceManager

### HSIStart

```solidity
event HSIStart(uint256 timestamp, address hsiAddress, address staker)
```

### HSIEnd

```solidity
event HSIEnd(uint256 timestamp, address hsiAddress, address staker)
```

### HSITransfer

```solidity
event HSITransfer(uint256 timestamp, address hsiAddress, address oldStaker, address newStaker)
```

### HSITokenize

```solidity
event HSITokenize(uint256 timestamp, uint256 hsiTokenId, address hsiAddress, address staker)
```

### HSIDetokenize

```solidity
event HSIDetokenize(uint256 timestamp, uint256 hsiTokenId, address hsiAddress, address staker)
```

### hsiLists

```solidity
function hsiLists(address generator, uint256 index) external view returns (address)
```

### hsiCount

```solidity
function hsiCount(address originator) external view returns (uint256)
```

### hexStakeDetokenize

```solidity
function hexStakeDetokenize(uint256 tokenId) external returns (address)
```

### hexStakeTokenize

```solidity
function hexStakeTokenize(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### hexStakeEnd

```solidity
function hexStakeEnd(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### hexStakeStart

```solidity
function hexStakeStart(uint256 amount, uint256 length) external returns (address)
```

### hsiToken

```solidity
function hsiToken(uint256 tokenId) external view returns (address)
```

### setApprovalForall

```solidity
function setApprovalForall(address operator, bool approved) external
```

