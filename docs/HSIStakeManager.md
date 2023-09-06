# Solidity API

## HSIStakeManager

### defaultEncodedSettings

```solidity
function defaultEncodedSettings() external pure returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the default encoded settings used by end stakers to tip and end stakes |

### _defaultSettings

```solidity
function _defaultSettings() internal pure returns (struct EncodableSettings.Settings)
```

gets default settings struct

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct EncodableSettings.Settings |  |

### depositHsi

```solidity
function depositHsi(uint256 tokenId, uint256 encodedSettings) external returns (address hsiAddress)
```

transfer stakes by their token ids

_requires approval to transfer hsi to this contract_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| tokenId | uint256 | the token id to move to this contract |
| encodedSettings | uint256 |  |

### _deposit721

```solidity
function _deposit721(address token, uint256 tokenId) internal returns (address owner)
```

### hsiAddressToId

```solidity
function hsiAddressToId(address hsiAddress) external view returns (uint256)
```

### _hsiAddressToId

```solidity
function _hsiAddressToId(address hsiAddress) internal view returns (uint256)
```

### withdrawHsi

```solidity
function withdrawHsi(address hsiAddress) external returns (uint256 tokenId)
```

### _withdraw721

```solidity
function _withdraw721(uint256 index, address owner, address hsiAddress) internal returns (uint256 tokenId)
```

### hsiStakeEndMany

```solidity
function hsiStakeEndMany(address[] hsiAddresses) external
```

### _verifyStakeMatchesIndex

```solidity
function _verifyStakeMatchesIndex(uint256, uint256 stakeId) internal view returns (struct IUnderlyingStakeable.StakeStore stake)
```

### _stakeEnd

```solidity
function _stakeEnd(uint256 index, uint256 stakeId, uint256 stakeCountAfter) internal returns (uint256 targetReward)
```

### _stakeStartFor

```solidity
function _stakeStartFor(address staker, uint256 newStakeAmount, uint256 newStakeDays, uint256 index) internal returns (uint256 stakeId)
```

### _mintHedron

```solidity
function _mintHedron(uint256 index, uint256 stakeId) internal returns (uint256)
```

### _checkStakeCustodian

```solidity
function _checkStakeCustodian(uint256 stakeId) internal view
```

check that this contract is the custodian of this hsi (nft was depostied and detokenized)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check ownership over |

