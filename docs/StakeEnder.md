# Solidity API

## StakeEnder

### INDEX_RIGHT_TODAY

```solidity
uint8 INDEX_RIGHT_TODAY
```

### stakeEndByConsent

```solidity
function stakeEndByConsent(uint256 stakeId) external payable returns (uint256 delta, uint256 count)
```

end a stake for someone other than the sender of the transaction

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id on the underlying contract to end |

### stakeEndByConsentWithTipTo

```solidity
function stakeEndByConsentWithTipTo(uint256 stakeId, address tipTo) external payable returns (uint256 delta, uint256 count)
```

### _stakeEndByConsentWithTipTo

```solidity
function _stakeEndByConsentWithTipTo(uint256 stakeId, address tipTo) internal returns (uint256 delta, uint256 count)
```

### _verifyStakeMatchesIndex

```solidity
function _verifyStakeMatchesIndex(uint256 index, uint256 stakeId) internal view virtual returns (struct IUnderlyingStakeable.StakeStore stake)
```

### _stakeEndByConsent

```solidity
function _stakeEndByConsent(uint256 stakeId, address tipTo, uint256 _count) internal returns (uint256 delta, uint256 count)
```

end a stake with the consent of the underlying staker's settings
hedron minting happens as last step before end stake

_the stake count is today | stake count because
if there were 2 variables, the contract ended up too large_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to end |
| tipTo | address |  |
| _count | uint256 |  |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| delta | uint256 | the amount of hex at the end of the stake |
| count | uint256 |  |

### stakeEndByConsentForMany

```solidity
function stakeEndByConsentForMany(uint256[] stakeIds) external payable
```

### stakeEndByConsentForManyWithTipTo

```solidity
function stakeEndByConsentForManyWithTipTo(uint256[] stakeIds, address tipTo) external payable
```

### _stakeEndByConsentForManyWithTipTo

```solidity
function _stakeEndByConsentForManyWithTipTo(uint256[] stakeIds, address tipTo) internal
```

end many stakes at the same time
provides an optimized path for all stake ends
and assumes that detectable failures should be skipped
this method should, generally, only be called when multiple enders
are attempting to end stake the same stakes

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIds | uint256[] | stake ids to end |
| tipTo | address |  |

### _stakeEnd

```solidity
function _stakeEnd(uint256 stakeIndex, uint256 stakeId, uint256 stakeCountAfter) internal virtual returns (uint256)
```

ends a stake for someone else

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeIndex | uint256 | the stake index on the underlying contract to end |
| stakeId | uint256 | the stake id on the underlying contract to end |
| stakeCountAfter | uint256 | the stake count after the stake is ended (current length - 1) |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 |  |

