# Solidity API

## StakeInfo

### stakeIdInfo

```solidity
mapping(uint256 => uint256) stakeIdInfo
```

the owner of a stake indexed by the stake id
index + 160(owner)

### StakeNotOwned

```solidity
error StakeNotOwned(address provided, address expected)
```

this error is thrown when the stake in question
is not owned by the expected address

### StakeNotCustodied

```solidity
error StakeNotCustodied(uint256 stakeId)
```

### verifyStakeOwnership

```solidity
function verifyStakeOwnership(address owner, uint256 stakeId) external view
```

verify the ownership of a stake given its id
error occurs if owner does not match

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the supposed owner of the stake |
| stakeId | uint256 | the id of the stake in question |

### _verifyStakeOwnership

```solidity
function _verifyStakeOwnership(address owner, uint256 stakeId) internal view
```

verify the ownership of a stake given its id
StakeNotOwned error occurs if owner does not match

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | the supposed owner of the stake |
| stakeId | uint256 | the id of the stake in question |

### verifyCustodian

```solidity
function verifyCustodian(uint256 stakeId) external view
```

verify that this contract knows the owner of a given stake id
and is acting as custodian for said owner
StakeNotCustodied error occurs if owner is not known

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to verify custodialship over |

### _verifyCustodian

```solidity
function _verifyCustodian(uint256 stakeId) internal view
```

verify that this contract knows the owner of a given stake id
and is acting as custodian for said owner
StakeNotCustodied error occurs if owner is not known

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to verify custodialship over |

### stakeIdToOwner

```solidity
function stakeIdToOwner(uint256 stakeId) external view returns (address owner)
```

get the owner of the stake id - the account that has rights over
the stake's settings and ability to end it outright
value will be address(0) for unknown

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id in question |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | of the stake at the provided id |

### _stakeIdToOwner

```solidity
function _stakeIdToOwner(uint256 stakeId) internal view returns (address owner)
```

access the owner of a given stake id
value will be address(0) for unknown

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id in question |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| owner | address | of a given stake id |

### stakeIdToInfo

```solidity
function stakeIdToInfo(uint256 stakeId) external view returns (uint256 index, address owner)
```

get the info of a stake given it's id. The index must match
the index of the stake in the hex/hedron contract

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to get info for |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | of the stake id in the hex list |
| owner | address | of the stake |

### _stakeIdToInfo

```solidity
function _stakeIdToInfo(uint256 stakeId) internal view returns (uint256 index, address owner)
```

retrieve the index and owner of a stake id
for a non custodied stake, the index is 0 and the owner is address(0)

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the id of the stake in question |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | the index of the stake in the hex list or the hsim list |
| owner | address | the owner of the stake |

### stakeIdToIndex

```solidity
function stakeIdToIndex(uint256 stakeId) external view returns (uint256 index)
```

the index of the stake id - useful when indexes are moving around
and could be moved by other people

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to target |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | of the stake in the targeted list |

### _stakeIdToIndex

```solidity
function _stakeIdToIndex(uint256 stakeId) internal view returns (uint256 index)
```

the index of the stake id - useful when indexes are moving around
and could be moved by other people

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to target |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | of the stake in the targeted list |

### encodeInfo

```solidity
function encodeInfo(uint256 index, address owner) external pure returns (uint256 info)
```

encode an index and owner pair to track under a single sload

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | index of a stake |
| owner | address | the owner of a stake |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| info | uint256 | the encoded uint256 that can be decoded to the index and owner |

### _encodeInfo

```solidity
function _encodeInfo(uint256 index, address owner) internal pure returns (uint256 info)
```

encode an index and owner pair to track under a single sload

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| index | uint256 | index of a stake |
| owner | address | the owner of a stake |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| info | uint256 | the encoded uint256 that can be decoded to the index and owner |

