---
id: fw3rrd9d
title: EncodableSettings
file_version: 1.1.3
app_version: 1.16.4
---

# Solidity API

## EncodableSettings

### UNUSED\_SPACE\_RIGHT\_UINT8

```
uint256 UNUSED_SPACE_RIGHT_UINT8
```

### UNUSED\_SPACE\_RIGHT\_UINT16

```
uint256 UNUSED_SPACE_RIGHT_UINT16
```

### UNUSED\_SPACE\_RIGHT\_UINT64

```
uint256 UNUSED_SPACE_RIGHT_UINT64
```

### INDEX\_HEDRON\_TIP\_METHOD

```
uint256 INDEX_HEDRON_TIP_METHOD
```

### INDEX\_HEDRON\_TIP\_MAGNITUDE

```
uint256 INDEX_HEDRON_TIP_MAGNITUDE
```

### UNUSED\_SPACE\_HEDRON\_TIP\_MAGNITUDE

```
uint256 UNUSED_SPACE_HEDRON_TIP_MAGNITUDE
```

### INDEX\_TIP\_METHOD

```
uint256 INDEX_TIP_METHOD
```

### UNUSED\_SPACE\_TIP\_METHOD

```
uint256 UNUSED_SPACE_TIP_METHOD
```

### INDEX\_TIP\_MAGNITUDE

```
uint256 INDEX_TIP_MAGNITUDE
```

### INDEX\_NEW\_STAKE\_METHOD

```
uint256 INDEX_NEW_STAKE_METHOD
```

### UNUSED\_SPACE\_NEW\_STAKE\_METHOD

```
uint256 UNUSED_SPACE_NEW_STAKE_METHOD
```

### INDEX\_NEW\_STAKE\_MAGNITUDE

```
uint256 INDEX_NEW_STAKE_MAGNITUDE
```

### INDEX\_NEW\_STAKE\_DAYS\_METHOD

```
uint256 INDEX_NEW_STAKE_DAYS_METHOD
```

### UNUSED\_SPACE\_NEW\_STAKE\_DAYS\_METHOD

```
uint256 UNUSED_SPACE_NEW_STAKE_DAYS_METHOD
```

### INDEX\_NEW\_STAKE\_DAYS\_MAGNITUDE

```
uint256 INDEX_NEW_STAKE_DAYS_MAGNITUDE
```

### UNUSED\_SPACE\_NEW\_STAKE\_DAYS\_MAGNITUDE

```
uint256 UNUSED_SPACE_NEW_STAKE_DAYS_MAGNITUDE
```

### INDEX\_COPY\_ITERATIONS

```
uint256 INDEX_COPY_ITERATIONS
```

### INDEX\_HAS\_EXTERNAL\_TIPS

```
uint256 INDEX_HAS_EXTERNAL_TIPS
```

### INDEX\_COPY\_EXTERNAL\_TIPS

```
uint256 INDEX_COPY_EXTERNAL_TIPS
```

### INDEX\_STAKE\_IS\_TRANSFERRABLE

```
uint256 INDEX_STAKE_IS_TRANSFERRABLE
```

### UNUSED\_SPACE\_STAKE\_IS\_TRANSFERRABLE

```
uint256 UNUSED_SPACE_STAKE_IS_TRANSFERRABLE
```

### INDEX\_SHOULD\_SEND\_TOKENS\_TO\_STAKER

```
uint256 INDEX_SHOULD_SEND_TOKENS_TO_STAKER
```

### INDEX\_CAN\_MINT\_HEDRON\_AT\_END

```
uint256 INDEX_CAN_MINT_HEDRON_AT_END
```

### INDEX\_CAN\_MINT\_HEDRON

```
uint256 INDEX_CAN_MINT_HEDRON
```

### INDEX\_CAN\_EARLY\_STAKE\_END

```
uint256 INDEX_CAN_EARLY_STAKE_END
```

### INDEX\_CAN\_STAKE\_END

```
uint256 INDEX_CAN_STAKE_END
```

### ConsentAbilities

```
struct ConsentAbilities {
  bool canStakeEnd;
  bool canEarlyStakeEnd;
  bool canMintHedron;
  bool canMintHedronAtEnd;
  bool shouldSendTokensToStaker;
  bool stakeIsTransferrable;
  bool copyExternalTips;
  bool hasExternalTips;
}
```

### Settings

```
struct Settings {
  uint256 hedronTipMethod;
  uint256 hedronTipMagnitude;
  uint256 tipMethod;
  uint256 tipMagnitude;
  uint256 newStakeMethod;
  uint256 newStakeMagnitude;
  uint256 newStakeDaysMethod;
  uint256 newStakeDaysMagnitude;
  uint256 copyIterations;
  struct EncodableSettings.ConsentAbilities consentAbilities;
}
```

### stakeIdToSettings

```
mapping(uint256 => uint256) stakeIdToSettings
```

### UpdateSettings

```
event UpdateSettings(uint256 stakeId, uint256 settings)
```

an event to signal that settings to direct funds at the end of a stake have been updated

#### Parameters

<br/>

|Name    |Type   |Description                  |
|--------|-------|-----------------------------|
|stakeId |uint256|the stake id that was updated|
|settings|uint256|the newly updated settings   |

<br/>

### defaultEncodedSettings

```
function defaultEncodedSettings() external pure virtual returns (uint256)
```

#### Return Values

<br/>

|Name |Type   |Description                                                           |
|-----|-------|----------------------------------------------------------------------|
|\[0\]|uint256|the default encoded settings used by end stakers to tip and end stakes|

<br/>

### stakeIdSettings

```
function stakeIdSettings(uint256 stakeId) external view returns (struct EncodableSettings.Settings)
```

access settings of a stake id and decode it, returning the decoded settings struct

#### Parameters

<br/>

|Name   |Type   |Description                      |
|-------|-------|---------------------------------|
|stakeId|uint256|the stake id to access and decode|

<br/>

#### Return Values

<br/>

|Name |Type                             |Description                                                  |
|-----|---------------------------------|-------------------------------------------------------------|
|\[0\]|struct EncodableSettings.Settings|decoded settings struct that holds all configuration by owner|

<br/>

### decodeConsentAbilities

```
function decodeConsentAbilities(uint256 abilities) external pure returns (struct EncodableSettings.ConsentAbilities)
```

decode a uint's first byte as consent abilities struct

#### Parameters

<br/>

|Name     |Type   |Description                        |
|---------|-------|-----------------------------------|
|abilities|uint256|encoded consent abilities to decode|

<br/>

#### Return Values

<br/>

|Name |Type                                     |Description                                           |
|-----|-----------------------------------------|------------------------------------------------------|
|\[0\]|struct EncodableSettings.ConsentAbilities|a ConsentAbilities struct with flags appropriately set|

<br/>

### \_decodeConsentAbilities

```
function _decodeConsentAbilities(uint256 abilities) internal pure returns (struct EncodableSettings.ConsentAbilities)
```

decode a uint's first byte as consent abilities struct

#### Parameters

<br/>

|Name     |Type   |Description                        |
|---------|-------|-----------------------------------|
|abilities|uint256|encoded consent abilities to decode|

<br/>

#### Return Values

<br/>

|Name |Type                                     |Description                                           |
|-----|-----------------------------------------|------------------------------------------------------|
|\[0\]|struct EncodableSettings.ConsentAbilities|a ConsentAbilities struct with flags appropriately set|

<br/>

### updateSettings

```
function updateSettings(uint256 stakeId, struct EncodableSettings.Settings settings) external payable virtual
```

updates settings under a stake id to the provided settings struct payable is only available to reduce costs, any native token sent to this method will be unattributed and claimable by anyone

#### Parameters

<br/>

|Name    |Type                             |Description                           |
|--------|---------------------------------|--------------------------------------|
|stakeId |uint256                          |the stake id to update                |
|settings|struct EncodableSettings.Settings|the settings to update the stake id to|

<br/>

### updateSettingsEncoded

```
function updateSettingsEncoded(uint256 stakeId, uint256 settings) external payable virtual
```

update a stake's settings by providing a new, encoded value

#### Parameters

<br/>

|Name    |Type   |Description                              |
|--------|-------|-----------------------------------------|
|stakeId |uint256|the stake id to update settings for      |
|settings|uint256|the settings value to update settings for|

<br/>

### \_updateSettingsEncoded

```
function _updateSettingsEncoded(uint256 stakeId, uint256 settings) internal
```

update a stake's setting by providing a uint256 encoded settings This method will validate that the msg.sender owns the stake

#### Parameters

<br/>

|Name    |Type   |Description                                                |
|--------|-------|-----------------------------------------------------------|
|stakeId |uint256|the stake id to update settings for                        |
|settings|uint256|the encoded settings to update to (7th index is maintained)|

<br/>

### \_logPreservedSettingsUpdate

```
function _logPreservedSettingsUpdate(uint256 stakeId, uint256 settings) internal
```

updates a stake id's settings

#### Parameters

<br/>

|Name    |Type   |Description                                                                                                     |
|--------|-------|----------------------------------------------------------------------------------------------------------------|
|stakeId |uint256|the stake id to update settings for                                                                             |
|settings|uint256|the settings to update against a provided stakeId. 7th index will be ignored as it is controlled by the contract|

<br/>

### \_logSettingsUpdate

```
function _logSettingsUpdate(uint256 stakeId, uint256 settings) internal
```

update the settings for a stake id

#### Parameters

<br/>

|Name    |Type   |Description                                                                       |
|--------|-------|----------------------------------------------------------------------------------|
|stakeId |uint256|the stake id to update settings for                                               |
|settings|uint256|an object that holds settings values to inform end stakers how to handle the stake|

<br/>

### readEncodedSettings

```
function readEncodedSettings(uint256 settings, uint256 fromEnd, uint256 length) external pure returns (uint256)
```

read a single property from encoded settings most useful for other contracts to pull out 1 property without needing logic for parsing

#### Parameters

<br/>

|Name    |Type   |Description                                |
|--------|-------|-------------------------------------------|
|settings|uint256|the settings number to read 1 property from|
|fromEnd |uint256|the index from the end to start at         |
|length  |uint256|the number of bits to read                 |

<br/>

### \_readEncodedSettings

```
function _readEncodedSettings(uint256 settings, uint256 fromEnd, uint256 length) internal pure returns (uint256)
```

parse out a single value from an encoded settings uint Only useful if you do not want the whole settings struct to be decoded

#### Parameters

<br/>

|Name    |Type   |Description                                         |
|--------|-------|----------------------------------------------------|
|settings|uint256|the settings value to parse out                     |
|fromEnd |uint256|the index (from left) to start at. Left most is 0   |
|length  |uint256|the number of bits to retain after the fromEnd param|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                                      |
|-----|-------|-----------------------------------------------------------------|
|\[0\]|uint256|the uint retained by the fromEnd and length arguments of settings|

<br/>

### encodeSettings

```
function encodeSettings(struct EncodableSettings.Settings settings) external pure returns (uint256 encoded)
```

encode a settings struct into it's number

#### Parameters

<br/>

|Name    |Type                             |Description                                    |
|--------|---------------------------------|-----------------------------------------------|
|settings|struct EncodableSettings.Settings|the settings struct to be encoded into a number|

<br/>

#### Return Values

<br/>

|Name   |Type   |Description                            |
|-------|-------|---------------------------------------|
|encoded|uint256|a uint256 expression of settings struct|

<br/>

### \_encodeSettings

```
function _encodeSettings(struct EncodableSettings.Settings settings) internal pure returns (uint256 encoded)
```

encode a settings struct as a uint value to fit it within 1 word

#### Parameters

<br/>

|Name    |Type                             |Description                            |
|--------|---------------------------------|---------------------------------------|
|settings|struct EncodableSettings.Settings|the settings struct to encode as a uint|

<br/>

#### Return Values

<br/>

|Name   |Type   |Description                            |
|-------|-------|---------------------------------------|
|encoded|uint256|a uint256 expression of settings struct|

<br/>

### decodeSettings

```
function decodeSettings(uint256 encoded) external pure returns (struct EncodableSettings.Settings settings)
```

decode an encoded setting into it's settings struct

#### Parameters

<br/>

|Name   |Type   |Description                  |
|-------|-------|-----------------------------|
|encoded|uint256|the encoded setting to decode|

<br/>

#### Return Values

<br/>

|Name    |Type                             |Description                |
|--------|---------------------------------|---------------------------|
|settings|struct EncodableSettings.Settings|the decoded settings struct|

<br/>

### \_decodeSettings

```
function _decodeSettings(uint256 encoded) internal pure returns (struct EncodableSettings.Settings settings)
```

decode a settings struct (2 words minimum) from a single uint256

#### Parameters

<br/>

|Name   |Type   |Description                                                            |
|-------|-------|-----------------------------------------------------------------------|
|encoded|uint256|a number that represents all data needed for an encoded settings struct|

<br/>

### encodeConsentAbilities

```
function encodeConsentAbilities(struct EncodableSettings.ConsentAbilities consentAbilities) external pure returns (uint256)
```

encode a ConsentAbilities struct to fit in 1 byte

#### Parameters

<br/>

|Name            |Type                                     |Description                                     |
|----------------|-----------------------------------------|------------------------------------------------|
|consentAbilities|struct EncodableSettings.ConsentAbilities|the consent abilities struct to encode as a uint|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                    |
|-----|-------|-----------------------------------------------|
|\[0\]|uint256|the encoded list of consetn abilities as a uint|

<br/>

### \_encodeConsentAbilities

```
function _encodeConsentAbilities(struct EncodableSettings.ConsentAbilities consentAbilities) internal pure returns (uint256)
```

encode a struct of consent abilities to fit in 1 byte

#### Parameters

<br/>

|Name            |Type                                     |Description                                              |
|----------------|-----------------------------------------|---------------------------------------------------------|
|consentAbilities|struct EncodableSettings.ConsentAbilities|encodes a struct of 8 booleans as a uint to fit in 1 byte|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                    |
|-----|-------|-----------------------------------------------|
|\[0\]|uint256|the encoded list of consent abilities as a uint|

<br/>

### \_defaultSettings

```
function _defaultSettings() internal pure virtual returns (struct EncodableSettings.Settings settings)
```

gets default settings struct

#### Return Values

<br/>

|Name    |Type                             |Description                 |
|--------|---------------------------------|----------------------------|
|settings|struct EncodableSettings.Settings|struct with default settings|

<br/>

### decrementCopyIterations

```
function decrementCopyIterations(uint256 setting) external pure returns (uint256)
```

modify the second byteword from the right to appropriately decrement the number of times that these settings should be copied

#### Parameters

<br/>

|Name   |Type   |Description                                                             |
|-------|-------|------------------------------------------------------------------------|
|setting|uint256|the setting to start with - only the 2nd byte from the right is modified|

<br/>

### \_decrementCopyIterations

```
function _decrementCopyIterations(uint256 setting) internal pure returns (uint256)
```

decrement the 2nd byte from the right if the value is < 255

#### Parameters

<br/>

|Name   |Type   |Description                                                             |
|-------|-------|------------------------------------------------------------------------|
|setting|uint256|the setting to start with - only the 2nd byte from the right is modified|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                                 |
|-----|-------|------------------------------------------------------------|
|\[0\]|uint256|updated encoded setting with appropriately decremented value|

<br/>

### defaultSettings

```
function defaultSettings() external pure virtual returns (struct EncodableSettings.Settings)
```

exposes the default settings to external for ease of access

#### Return Values

<br/>

|Name |Type                             |Description                          |
|-----|---------------------------------|-------------------------------------|
|\[0\]|struct EncodableSettings.Settings|a settings struct with default values|

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBc3Rha2UtbWFuYWdlciUzQSUzQWhleHBheS1kYXk=/docs/fw3rrd9d).
