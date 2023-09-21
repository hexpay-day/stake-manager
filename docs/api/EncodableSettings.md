
## EncodableSettings

### UNUSED_SPACE_RIGHT_UINT8

```solidity
uint256 UNUSED_SPACE_RIGHT_UINT8
```

### UNUSED_SPACE_RIGHT_UINT16

```solidity
uint256 UNUSED_SPACE_RIGHT_UINT16
```

### UNUSED_SPACE_RIGHT_UINT64

```solidity
uint256 UNUSED_SPACE_RIGHT_UINT64
```

### INDEX_RIGHT_HEDRON_TIP

```solidity
uint256 INDEX_RIGHT_HEDRON_TIP
```

### INDEX_RIGHT_TARGET_TIP

```solidity
uint256 INDEX_RIGHT_TARGET_TIP
```

### INDEX_LEFT_TARGET_TIP

```solidity
uint256 INDEX_LEFT_TARGET_TIP
```

### INDEX_RIGHT_NEW_STAKE

```solidity
uint256 INDEX_RIGHT_NEW_STAKE
```

### INDEX_LEFT_NEW_STAKE

```solidity
uint256 INDEX_LEFT_NEW_STAKE
```

### INDEX_RIGHT_NEW_STAKE_DAYS_METHOD

```solidity
uint256 INDEX_RIGHT_NEW_STAKE_DAYS_METHOD
```

### UNUSED_SPACE_RIGHT_NEW_STAKE_DAYS_METHOD

```solidity
uint256 UNUSED_SPACE_RIGHT_NEW_STAKE_DAYS_METHOD
```

### INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE

```solidity
uint256 INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE
```

### UNUSED_SPACE_RIGHT_NEW_STAKE_DAYS_MAGNITUDE

```solidity
uint256 UNUSED_SPACE_RIGHT_NEW_STAKE_DAYS_MAGNITUDE
```

### INDEX_RIGHT_COPY_ITERATIONS

```solidity
uint256 INDEX_RIGHT_COPY_ITERATIONS
```

### INDEX_RIGHT_HAS_EXTERNAL_TIPS

```solidity
uint256 INDEX_RIGHT_HAS_EXTERNAL_TIPS
```

### INDEX_RIGHT_COPY_EXTERNAL_TIPS

```solidity
uint256 INDEX_RIGHT_COPY_EXTERNAL_TIPS
```

### INDEX_RIGHT_STAKE_IS_TRANSFERABLE

```solidity
uint256 INDEX_RIGHT_STAKE_IS_TRANSFERABLE
```

### INDEX_LEFT_STAKE_IS_TRANSFERABLE

```solidity
uint256 INDEX_LEFT_STAKE_IS_TRANSFERABLE
```

### INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER

```solidity
uint256 INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER
```

### INDEX_RIGHT_CAN_MINT_HEDRON_AT_END

```solidity
uint256 INDEX_RIGHT_CAN_MINT_HEDRON_AT_END
```

### INDEX_RIGHT_CAN_MINT_HEDRON

```solidity
uint256 INDEX_RIGHT_CAN_MINT_HEDRON
```

### INDEX_RIGHT_CAN_EARLY_STAKE_END

```solidity
uint256 INDEX_RIGHT_CAN_EARLY_STAKE_END
```

### INDEX_RIGHT_CAN_STAKE_END

```solidity
uint256 INDEX_RIGHT_CAN_STAKE_END
```

### ConsentAbilities

```solidity
struct ConsentAbilities {
  bool canStakeEnd;
  bool canEarlyStakeEnd;
  bool canMintHedron;
  bool canMintHedronAtEnd;
  bool shouldSendTokensToStaker;
  bool stakeIsTransferable;
  bool copyExternalTips;
  bool hasExternalTips;
}
```

### Settings

```solidity
struct Settings {
  struct Magnitude.Linear hedronTip;
  struct Magnitude.Linear targetTip;
  struct Magnitude.Linear newStake;
  uint256 newStakeDaysMethod;
  uint256 newStakeDaysMagnitude;
  uint256 copyIterations;
  struct EncodableSettings.ConsentAbilities consentAbilities;
}
```

### stakeIdToSettings

```solidity
mapping(uint256 => uint256) stakeIdToSettings
```

### UpdateSettings

```solidity
event UpdateSettings(uint256 stakeId, uint256 settings)
```

an event to signal that settings to direct funds
at the end of a stake have been updated

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id that was updated |
| settings | uint256 | the newly updated settings |

### defaultEncodedSettings

```solidity
function defaultEncodedSettings() external pure virtual returns (uint256)
```

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the default encoded settings used by end stakers to tip and end stakes |

### stakeIdSettings

```solidity
function stakeIdSettings(uint256 stakeId) external view returns (struct EncodableSettings.Settings)
```

access settings of a stake id and decode it, returning the decoded settings struct

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to access and decode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct EncodableSettings.Settings | decoded settings struct that holds all configuration by owner |

### decodeConsentAbilities

```solidity
function decodeConsentAbilities(uint256 abilities) external pure returns (struct EncodableSettings.ConsentAbilities)
```

decode a uint's first byte as consent abilities struct

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| abilities | uint256 | encoded consent abilities to decode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct EncodableSettings.ConsentAbilities | a ConsentAbilities struct with flags appropriately set |

### _decodeConsentAbilities

```solidity
function _decodeConsentAbilities(uint256 abilities) internal pure returns (struct EncodableSettings.ConsentAbilities)
```

decode a uint's first byte as consent abilities struct

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| abilities | uint256 | encoded consent abilities to decode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct EncodableSettings.ConsentAbilities | a ConsentAbilities struct with flags appropriately set |

### updateSettings

```solidity
function updateSettings(uint256 stakeId, struct EncodableSettings.Settings settings) external payable virtual
```

updates settings under a stake id to the provided settings struct
payable is only available to reduce costs, any native token
sent to this method will be unattributed and claimable by anyone

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to update |
| settings | struct EncodableSettings.Settings | the settings to update the stake id to |

### updateSettingsEncoded

```solidity
function updateSettingsEncoded(uint256 stakeId, uint256 settings) external payable virtual
```

update a stake's settings by providing a new, encoded value

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to update settings for |
| settings | uint256 | the settings value to update settings for |

### _updateSettingsEncoded

```solidity
function _updateSettingsEncoded(uint256 stakeId, uint256 settings) internal
```

update a stake's setting by providing a uint256 encoded settings
This method will validate that the msg.sender owns the stake

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to update settings for |
| settings | uint256 | the encoded settings to update to (7th index is maintained) |

### _logPreservedSettingsUpdate

```solidity
function _logPreservedSettingsUpdate(uint256 stakeId, uint256 settings) internal
```

updates a stake id's settings

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to update settings for |
| settings | uint256 | the settings to update against a provided stakeId. 7th index will be ignored as it is controlled by the contract |

### _logSettingsUpdate

```solidity
function _logSettingsUpdate(uint256 stakeId, uint256 settings) internal
```

update the settings for a stake id

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| stakeId | uint256 | the stake id to update settings for |
| settings | uint256 | an object that holds settings values to inform end stakers how to handle the stake |

### readEncodedSettings

```solidity
function readEncodedSettings(uint256 settings, uint256 fromEnd, uint256 length) external pure returns (uint256)
```

read a single property from encoded settings
most useful for other contracts to pull out 1 property without
needing logic for parsing

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | uint256 | the settings number to read 1 property from |
| fromEnd | uint256 | the index from the end to start at |
| length | uint256 | the number of bits to read |

### _readEncodedSettings

```solidity
function _readEncodedSettings(uint256 settings, uint256 fromEnd, uint256 length) internal pure returns (uint256)
```

parse out a single value from an encoded settings uint Only useful
if you do not want the whole settings struct to be decoded

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | uint256 | the settings value to parse out |
| fromEnd | uint256 | the index (from left) to start at. Left most is 0 |
| length | uint256 | the number of bits to retain after the fromEnd param |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the uint retained by the fromEnd and length arguments of settings |

### encodeSettings

```solidity
function encodeSettings(struct EncodableSettings.Settings settings) external pure returns (uint256 encoded)
```

encode a settings struct into it's number

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | struct EncodableSettings.Settings | the settings struct to be encoded into a number |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| encoded | uint256 | a uint256 expression of settings struct |

### _encodeSettings

```solidity
function _encodeSettings(struct EncodableSettings.Settings settings) internal pure returns (uint256 encoded)
```

encode a settings struct as a uint value to fit it within 1 word

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | struct EncodableSettings.Settings | the settings struct to encode as a uint |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| encoded | uint256 | a uint256 expression of settings struct |

### decodeSettings

```solidity
function decodeSettings(uint256 encoded) external pure returns (struct EncodableSettings.Settings settings)
```

decode an encoded setting into it's settings struct

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encoded | uint256 | the encoded setting to decode |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | struct EncodableSettings.Settings | the decoded settings struct |

### _decodeSettings

```solidity
function _decodeSettings(uint256 encoded) internal pure returns (struct EncodableSettings.Settings settings)
```

decode a settings struct (2 words minimum) from a single uint256

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| encoded | uint256 | a number that represents all data needed for an encoded settings struct |

### encodeConsentAbilities

```solidity
function encodeConsentAbilities(struct EncodableSettings.ConsentAbilities consentAbilities) external pure returns (uint256)
```

encode a ConsentAbilities struct to fit in 1 byte

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consentAbilities | struct EncodableSettings.ConsentAbilities | the consent abilities struct to encode as a uint |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the encoded list of consetn abilities as a uint |

### _encodeConsentAbilities

```solidity
function _encodeConsentAbilities(struct EncodableSettings.ConsentAbilities consentAbilities) internal pure returns (uint256)
```

encode a struct of consent abilities to fit in 1 byte

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| consentAbilities | struct EncodableSettings.ConsentAbilities | encodes a struct of 8 booleans as a uint to fit in 1 byte |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | the encoded list of consent abilities as a uint |

### _defaultSettings

```solidity
function _defaultSettings() internal pure virtual returns (struct EncodableSettings.Settings settings)
```

gets default settings struct

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| settings | struct EncodableSettings.Settings | struct with default settings |

### decrementCopyIterations

```solidity
function decrementCopyIterations(uint256 setting) external pure returns (uint256)
```

modify the second byteword from the right to appropriately decrement
the number of times that these settings should be copied

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| setting | uint256 | the setting to start with - only the 2nd byte from the right is modified |

### _decrementCopyIterations

```solidity
function _decrementCopyIterations(uint256 setting) internal pure returns (uint256)
```

decrement the 2nd byte from the right if the value is < 255

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| setting | uint256 | the setting to start with - only the 2nd byte from the right is modified |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | uint256 | updated encoded setting with appropriately decremented value |

### defaultSettings

```solidity
function defaultSettings() external pure virtual returns (struct EncodableSettings.Settings)
```

exposes the default settings to external for ease of access

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct EncodableSettings.Settings | a settings struct with default values |

