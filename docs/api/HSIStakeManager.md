
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

deposit a tokenized hsi into this contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| token | address | the address of the token (HEDRON) |
| tokenId | uint256 | the token id to deposit into this contract |

### hsiAddressToId

```solidity
function hsiAddressToId(address hsiAddress) external view returns (uint256)
```

a convenience method to retrieve a stake id from an hsi address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| hsiAddress | address | the hsi address to target |

### _hsiAddressToId

```solidity
function _hsiAddressToId(address hsiAddress) internal view returns (uint256)
```

an internal convenience method to retreive a stake id from an hsi address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| hsiAddress | address | the hsi address to target |

### withdrawHsi

```solidity
function withdrawHsi(address hsiAddress) external returns (uint256 tokenId)
```

withdraw an hsi from this contract's custody

_caller must be logged as owner of hsi_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| hsiAddress | address | the hsi address to withdraw from this contract |

### _hsiCount

```solidity
function _hsiCount() internal view returns (uint256)
```

the count or length of hsi's attributed to this contract

### hsiCount

```solidity
function hsiCount() external view returns (uint256)
```

the count or length of hsi's attributed to this contract

### _withdraw721

```solidity
function _withdraw721(uint256 index, address owner, address hsiAddress) internal returns (uint256 tokenId)
```

tokenize/mint a stake's erc721 token to transfer ownership of it

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | the index of the stake to tokenize |
| owner | address | the owner of the stake |
| hsiAddress | address | the hsi address (contract) that the stake is being custodied by |

### hsiStakeEndMany

```solidity
function hsiStakeEndMany(address[] hsiAddresses) external payable
```

### hsiStakeEndManyWithTipTo

```solidity
function hsiStakeEndManyWithTipTo(address[] hsiAddresses, address tipTo) external payable
```

### _hsiStakeEndMany

```solidity
function _hsiStakeEndMany(address[] hsiAddresses, address tipTo) internal
```

provide a list of hsi addresses to end the stake of

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| hsiAddresses | address[] | a list of hsi addresses (known in this contract as stake ids) |
| tipTo | address |  |

### _verifyStakeMatchesIndex

```solidity
function _verifyStakeMatchesIndex(uint256, uint256 stakeId) internal view returns (struct IUnderlyingStakeable.StakeStore stake)
```

retrieve a stake id's (hsi address's) singular stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
|  | uint256 |  |
| stakeId | uint256 | the stake id or hsi address to retrieve a stake from its list |

### _stakeEnd

```solidity
function _stakeEnd(uint256 index, uint256 stakeId, uint256 stakeCountAfter) internal returns (uint256 targetReward)
```

end a hsi's stake and return the amount of
unattributed tokens sent to this contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | the hsim index of the stake to end |
| stakeId | uint256 | the stake id or hsi address |
| stakeCountAfter | uint256 | the length of stakes that will exist under the hsim after this end operation is complete |

### _rewriteIndex

```solidity
function _rewriteIndex(uint256 index) internal
```

### _stakeStartFor

```solidity
function _stakeStartFor(address staker, uint256 newStakeAmount, uint256 newStakeDays, uint256 index) internal returns (uint256 stakeId)
```

starts an hsi for the provided staker and saves its data appropriately

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| staker | address | the staker that will own this stake |
| newStakeAmount | uint256 | the number of tokens to add to the newly formed stake |
| newStakeDays | uint256 | the number of days to stake said tokens for |
| index | uint256 | the index of the stake in the list of all stakes |

### _mintHedron

```solidity
function _mintHedron(uint256 index, uint256 stakeId) internal returns (uint256)
```

mint hedron from an hsi

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | the index of the stake on hsim to mint |
| stakeId | uint256 | the stake id or in this case, hsi address |

### _checkStakeCustodian

```solidity
function _checkStakeCustodian(uint256 stakeId) internal view
```

check that this contract is the custodian of this hsi (nft was depostied and detokenized)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to check ownership over |

