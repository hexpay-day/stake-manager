
## IHedron

### Claim

```solidity
event Claim(uint256 data, address claimant, uint40 stakeId)
```

### LoanEnd

```solidity
event LoanEnd(uint256 data, address borrower, uint40 stakeId)
```

### LoanLiquidateBid

```solidity
event LoanLiquidateBid(uint256 data, address bidder, uint40 stakeId, uint40 liquidationId)
```

### LoanLiquidateExit

```solidity
event LoanLiquidateExit(uint256 data, address liquidator, uint40 stakeId, uint40 liquidationId)
```

### LoanLiquidateStart

```solidity
event LoanLiquidateStart(uint256 data, address borrower, uint40 stakeId, uint40 liquidationId)
```

### LoanPayment

```solidity
event LoanPayment(uint256 data, address borrower, uint40 stakeId)
```

### LoanStart

```solidity
event LoanStart(uint256 data, address borrower, uint40 stakeId)
```

### Mint

```solidity
event Mint(uint256 data, address minter, uint40 stakeId)
```

### hsim

```solidity
function hsim() external view returns (address)
```

### mintInstanced

```solidity
function mintInstanced(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### mintNative

```solidity
function mintNative(uint256 stakeIndex, uint40 stakeId) external returns (uint256)
```

