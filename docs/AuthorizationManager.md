# Solidity API

## AuthorizationManager

This module is used to hash inputs pertaining to access control around various
aspects that a developer may care about. For instance, access on a global scope
vs a scope that has a reuired input may have different permission

### authorization

```solidity
mapping(bytes32 => uint256) authorization
```

tracks which keys are provided which authorization permissions

_most of the time the keys will be addresses
so you will often have to encode the addresses as byte32_

### UpdateAuthorization

```solidity
event UpdateAuthorization(bytes32 key, uint256 settings)
```

emitted after settings are updated to allow various
addresses and key combinations to act on owners behalf

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| key | bytes32 | the key, usually an address, that is authorized to perform new actions |
| settings | uint256 | the settings number - used as binary |

### MAX_AUTHORIZATION

```solidity
uint256 MAX_AUTHORIZATION
```

the maximum authorization value that a setting can hold
- this is enforced during _setAuthorization only so it
could be set elsewhere if the contract decides to

### constructor

```solidity
constructor(uint256 maxAuthorization) internal
```

Sets up the contract by accepting a value limit during construction.
Usually this is type(uint8).max or other derived value

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| maxAuthorization | uint256 | the maximum uint that can be set on the authorization manager as a value. |

### _setAuthorization

```solidity
function _setAuthorization(bytes32 key, uint256 settings) internal
```

set the authorization status of an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| key | bytes32 | the address to set the authorization flag of |
| settings | uint256 | allowed to start / end / early end stakes |

### _setAddressAuthorization

```solidity
function _setAddressAuthorization(address account, uint256 settings) internal
```

sets an authorization level for an address

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to scope an authorization value |
| settings | uint256 | the settings configuration in uint256 form |

### isAddressAuthorized

```solidity
function isAddressAuthorized(address account, uint256 index) external view returns (bool)
```

check if an address is authorized to perform an action
this index will be different for each implementation

_the index is an index of the bits as in binary (1/0)_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to verify is authorized to do an action |
| index | uint256 | the index of the bit to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | whether or not the address authorization value has a 1/0 at the provided index |

### _isAddressAuthorized

```solidity
function _isAddressAuthorized(address account, uint256 index) internal view returns (bool)
```

check if the provided address is authorized to perform an action

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the address to check authorization against |
| index | uint256 | the index of the setting boolean to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | whether or not the address authorization value has a 1/0 at the provided index |

### _isAuthorized

```solidity
function _isAuthorized(bytes32 key, uint256 index) internal view returns (bool)
```

check the index of the setting for the provided key
return true if flag is true

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| key | bytes32 | the key to check against the authorization mapping |
| index | uint256 | the index of the setting flag to check |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | whether or not the authorization value has a 1 or a 0 at the provided index |

### _getAddressSetting

```solidity
function _getAddressSetting(address account) internal view returns (uint256)
```

access setting scoped under an account (address) only

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| account | address | the account whose settings you wish to access |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | arbitrary authorization value |

