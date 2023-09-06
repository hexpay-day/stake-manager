---
id: g849fh5e
title: index
file_version: 1.1.3
app_version: 1.16.4
---

# Solidity API

## AuthorizationManager

This module is used to hash inputs pertaining to access control around various aspects that a developer may care about. For instance, access on a global scope vs a scope that has a reuired input may have different permission

### authorization

```
mapping(bytes32 => uint256) authorization
```

tracks which keys are provided which authorization permissions

_most of the time the keys will be addresses so you will often have to encode the addresses as byte32_

### UpdateAuthorization

```
event UpdateAuthorization(bytes32 key, uint256 settings)
```

emitted after settings are updated to allow various addresses and key combinations to act on owners behalf

#### Parameters

<br/>

|Name    |Type   |Description                                                           |
|--------|-------|----------------------------------------------------------------------|
|key     |bytes32|the key, usually an address, that is authorized to perform new actions|
|settings|uint256|the settings number - used as binary                                  |

<br/>

### MAX\_AUTHORIZATION

```
uint256 MAX_AUTHORIZATION
```

the maximum authorization value that a setting can hold

*   this is enforced during \_setAuthorization only so it could be set elsewhere if the contract decides to

### constructor

```
constructor(uint256 maxAuthorization) internal
```

Sets up the contract by accepting a value limit during construction. Usually this is type(uint8).max or other derived value

#### Parameters

<br/>

|Name            |Type   |Description                                                              |
|----------------|-------|-------------------------------------------------------------------------|
|maxAuthorization|uint256|the maximum uint that can be set on the authorization manager as a value.|

<br/>

### \_setAuthorization

```
function _setAuthorization(bytes32 key, uint256 settings) internal
```

set the authorization status of an address

#### Parameters

<br/>

|Name    |Type   |Description                                 |
|--------|-------|--------------------------------------------|
|key     |bytes32|the address to set the authorization flag of|
|settings|uint256|allowed to start / end / early end stakes   |

<br/>

### \_setAddressAuthorization

```
function _setAddressAuthorization(address account, uint256 settings) internal
```

sets an authorization level for an address

#### Parameters

<br/>

|Name    |Type   |Description                                |
|--------|-------|-------------------------------------------|
|account |address|the address to scope an authorization value|
|settings|uint256|the settings configuration in uint256 form |

<br/>

### isAddressAuthorized

```
function isAddressAuthorized(address account, uint256 index) external view returns (bool)
```

check if an address is authorized to perform an action this index will be different for each implementation

_the index is an index of the bits as in binary (1/0)_

#### Parameters

<br/>

|Name   |Type   |Description                                        |
|-------|-------|---------------------------------------------------|
|account|address|the address to verify is authorized to do an action|
|index  |uint256|the index of the bit to check                      |

<br/>

#### Return Values

<br/>

|Name |Type|Description                                                                   |
|-----|----|------------------------------------------------------------------------------|
|\[0\]|bool|whether or not the address authorization value has a 1/0 at the provided index|

<br/>

### \_isAddressAuthorized

```
function _isAddressAuthorized(address account, uint256 index) internal view returns (bool)
```

check if the provided address is authorized to perform an action

#### Parameters

<br/>

|Name   |Type   |Description                               |
|-------|-------|------------------------------------------|
|account|address|the address to check authorization against|
|index  |uint256|the index of the setting boolean to check |

<br/>

#### Return Values

<br/>

|Name |Type|Description                                                                   |
|-----|----|------------------------------------------------------------------------------|
|\[0\]|bool|whether or not the address authorization value has a 1/0 at the provided index|

<br/>

### \_isAuthorized

```
function _isAuthorized(bytes32 key, uint256 index) internal view returns (bool)
```

check the index of the setting for the provided key return true if flag is true

#### Parameters

<br/>

|Name |Type   |Description                                       |
|-----|-------|--------------------------------------------------|
|key  |bytes32|the key to check against the authorization mapping|
|index|uint256|the index of the setting flag to check            |

<br/>

#### Return Values

<br/>

|Name |Type|Description                                                                |
|-----|----|---------------------------------------------------------------------------|
|\[0\]|bool|whether or not the authorization value has a 1 or a 0 at the provided index|

<br/>

### \_getAddressSetting

```
function _getAddressSetting(address account) internal view returns (uint256)
```

access setting scoped under an account (address) only

#### Parameters

<br/>

|Name   |Type   |Description                                  |
|-------|-------|---------------------------------------------|
|account|address|the account whose settings you wish to access|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                  |
|-----|-------|-----------------------------|
|\[0\]|uint256|arbitrary authorization value|

<br/>

## Bank

this contract should never owe more than the withdrawableBalanceOf's it has in erc20 terms

### attributed

```
mapping(address => uint256) attributed
```

### withdrawableBalanceOf

```
mapping(address => mapping(address => uint256)) withdrawableBalanceOf
```

### \_getUnattributed

```
function _getUnattributed(address token) internal view returns (uint256)
```

gets unattributed tokens floating in the contract

#### Parameters

<br/>

|Name |Type   |Description                                                            |
|-----|-------|-----------------------------------------------------------------------|
|token|address|the address of the token that you wish to get the unattributed value of|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                                                                                                 |
|-----|-------|----------------------------------------------------------------------------------------------------------------------------|
|\[0\]|uint256|a uint representing the amount of tokens that have been deposited into the contract, which are not attributed to any address|

<br/>

### \_getBalance

```
function _getBalance(address token, address owner) internal view returns (uint256)
```

get the balance and ownership of any token

#### Parameters

<br/>

|Name |Type   |Description                                                             |
|-----|-------|------------------------------------------------------------------------|
|token|address|the token address that you wish to get the balance of (including native)|
|owner|address|the owner address to get the balance of                                 |

<br/>

### getUnattributed

```
function getUnattributed(address token) external view returns (uint256)
```

gets the amount of unattributed tokens

#### Parameters

<br/>

|Name |Type   |Description                                 |
|-----|-------|--------------------------------------------|
|token|address|the token to get the unattributed balance of|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                |
|-----|-------|-------------------------------------------|
|\[0\]|uint256|the amount of a token that can be withdrawn|

<br/>

### clamp

```
function clamp(uint256 amount, uint256 max) external pure returns (uint256)
```

given a provided input amount, clamp the input to a maximum, using maximum if 0 provided

#### Parameters

<br/>

|Name  |Type   |Description                             |
|------|-------|----------------------------------------|
|amount|uint256|the requested or input amount           |
|max   |uint256|the maximum amount that the value can be|

<br/>

### \_clamp

```
function _clamp(uint256 amount, uint256 max) internal pure returns (uint256)
```

clamp a given amount to the maximum amount use the maximum amount if no amount is requested

#### Parameters

<br/>

|Name  |Type   |Description                             |
|------|-------|----------------------------------------|
|amount|uint256|the amount requested by another function|
|max   |uint256|the limit that the value can be         |

<br/>

### depositToken

```
function depositToken(address token, uint256 amount) external payable returns (uint256)
```

transfer a given number of tokens to the contract to be used by the contract's methods an extra layer of protection is provided by this method and can be refused by calling the dangerous version

#### Parameters

<br/>

|Name  |Type   |Description                                     |
|------|-------|------------------------------------------------|
|token |address|<br/>                                           |
|amount|uint256|the number of tokens to transfer to the contract|

<br/>

### depositTokenTo

```
function depositTokenTo(address token, address to, uint256 amount) external payable returns (uint256)
```

deposit an amount of tokens to the contract and attribute them to the provided address

#### Parameters

<br/>

|Name  |Type   |Description                              |
|------|-------|-----------------------------------------|
|token |address|<br/>                                    |
|to    |address|the account to give ownership over tokens|
|amount|uint256|the amount of tokens                     |

<br/>

### \_depositTokenTo

```
function _depositTokenTo(address token, address to, uint256 amount) internal returns (uint256)
```

### collectUnattributed

```
function collectUnattributed(address token, bool transferOut, address payable to, uint256 amount) external payable returns (uint256)
```

collect unattributed tokens and send to recipient of choice when 0 is passed, withdraw maximum available or in other words, all unattributed tokens

#### Parameters

<br/>

|Name       |Type           |Description                                              |
|-----------|---------------|---------------------------------------------------------|
|token      |address        |<br/>                                                    |
|transferOut|bool           |transfers tokens to the provided address                 |
|to         |address payable|the address to receive or have tokens attributed to      |
|amount     |uint256        |the requested amount - clamped to the amount unattributed|

<br/>

### \_collectUnattributed

```
function _collectUnattributed(address token, bool transferOut, address payable to, uint256 amount, uint256 max) internal returns (uint256 withdrawable)
```

### collectUnattributedPercent

```
function collectUnattributedPercent(address token, bool transferOut, address payable recipient, uint256 basisPoints) external returns (uint256 amount)
```

collect a number of unattributed tokens as basis points

#### Parameters

<br/>

|Name       |Type           |Description                                |
|-----------|---------------|-------------------------------------------|
|token      |address        |the token that you wish to collect         |
|transferOut|bool           |whether to transfer token out              |
|recipient  |address payable|the recipient of the tokens                |
|basisPoints|uint256        |the number of basis points (100% = 10\_000)|

<br/>

### withdrawTokenTo

```
function withdrawTokenTo(address token, address payable to, uint256 amount) external payable returns (uint256)
```

transfer an amount of tokens currently attributed to the withdrawable balance of the sender

#### Parameters

<br/>

|Name  |Type           |Description                                                 |
|------|---------------|------------------------------------------------------------|
|token |address        |the token to transfer - uses address(0) for native          |
|to    |address payable|the to of the funds                                         |
|amount|uint256        |the amount that should be deducted from the sender's balance|

<br/>

### \_getTokenBalance

```
function _getTokenBalance(address token) internal view returns (uint256)
```

### \_addToTokenWithdrawable

```
function _addToTokenWithdrawable(address token, address to, uint256 amount) internal
```

adds a balance to the provided staker of the magnitude given in amount

#### Parameters

<br/>

|Name  |Type   |Description                                                                            |
|------|-------|---------------------------------------------------------------------------------------|
|token |address|<br/>                                                                                  |
|to    |address|the account to add a withdrawable balance to                                           |
|amount|uint256|the amount to add to the staker's withdrawable balance as well as the attributed tokens|

<br/>

### \_deductWithdrawable

```
function _deductWithdrawable(address token, address account, uint256 amount) internal returns (uint256)
```

deduce an amount from the provided account after a deduction, funds could be considered "unattributed" and if they are left in such a state they could be picked up by anyone else

#### Parameters

<br/>

|Name   |Type   |Description                     |
|-------|-------|--------------------------------|
|token  |address|<br/>                           |
|account|address|the account to deduct funds from|
|amount |uint256|the amount of funds to deduct   |

<br/>

### \_depositTokenFrom

```
function _depositTokenFrom(address token, address depositor, uint256 amount) internal returns (uint256 amnt)
```

deposits tokens from a staker and marks them for that staker

### depositTokenUnattributed

```
function depositTokenUnattributed(address token, uint256 amount) external
```

deposit a number of tokens to the contract

#### Parameters

<br/>

|Name  |Type   |Description                    |
|------|-------|-------------------------------|
|token |address|<br/>                          |
|amount|uint256|the number of tokens to deposit|

<br/>

### \_withdrawTokenTo

```
function _withdrawTokenTo(address token, address payable to, uint256 amount) internal returns (uint256)
```

transfers tokens to a recipient

#### Parameters

<br/>

|Name  |Type           |Description                 |
|------|---------------|----------------------------|
|token |address        |<br/>                       |
|to    |address payable|where to send the tokens    |
|amount|uint256        |the number of tokens to send|

<br/>

### \_attributeFunds

```
function _attributeFunds(uint256 setting, uint256 index, address token, address staker, uint256 amount) internal
```

## CurrencyList

### AddCurrency

```
event AddCurrency(address token, uint256 index)
```

### indexToToken

```
address[] indexToToken
```

### currencyToIndex

```
mapping(address => uint256) currencyToIndex
```

### addCurrencyToList

```
function addCurrencyToList(address token) external returns (uint256)
```

creates a registry of tokens to map addresses that stakes will tip in to numbers so that they can fit in a single byteword, reducing costs when tips in the same currency occur

#### Parameters

<br/>

|Name |Type   |Description                                    |
|-----|-------|-----------------------------------------------|
|token|address|the token to add to the list of tippable tokens|

<br/>

### \_addCurrencyToList

```
function _addCurrencyToList(address token) internal returns (uint256)
```

adds a hash to a list and mapping to fit them in smaller sload counts

#### Parameters

<br/>

|Name |Type   |Description                                                |
|-----|-------|-----------------------------------------------------------|
|token|address|the token to add to the internally tracked list and mapping|

<br/>

### currencyListSize

```
function currencyListSize() external view returns (uint256)
```

## EarningsOracle

### lastZeroDay

```
uint256 lastZeroDay
```

### MAX\_CATCH\_UP\_DAYS

```
uint256 MAX_CATCH_UP_DAYS
```

_this max constraint is very generous given that the sstore opcode costs ~20k gas at the time of writing_

### MAX\_UINT\_128

```
uint256 MAX_UINT_128
```

### SHARE\_SCALE

```
uint256 SHARE_SCALE
```

### totals

```
struct EarningsOracle.TotalStore[] totals
```

### TotalStore

```
struct TotalStore {
  uint128 payout;
  uint128 shares;
}
```

### Total

```
struct Total {
  uint256 payout;
  uint256 shares;
}
```

### constructor

```
constructor(uint256 _lastZeroDay, uint256 untilDay) public
```

deploy contract and start collecting data immediately. pass 0 for untilDay arg to skip collection and start with nothing in payoutTotal array

#### Parameters

<br/>

|Name         |Type   |Description                                                        |
|-------------|-------|-------------------------------------------------------------------|
|\_lastZeroDay|uint256|the final day to allow zero value (used to filter out empty values)|
|untilDay     |uint256|the day to end collection                                          |

<br/>

### totalsCount

```
function totalsCount() external view returns (uint256 count)
```

the size of the payoutTotal array - correlates to days stored

### payoutDelta

```
function payoutDelta(uint256 startDay, uint256 untilDay) external view returns (uint256 payout, uint256 shares)
```

the delta between two days. untilDay argument must be greater than startDay argument otherwise call may fail

#### Parameters

<br/>

|Name    |Type   |Description                    |
|--------|-------|-------------------------------|
|startDay|uint256|the day to start counting from |
|untilDay|uint256|the day to end with (inclusive)|

<br/>

### payoutDeltaTrucated

```
function payoutDeltaTrucated(uint256 startDay, uint256 untilDay, uint256 multiplier) external view returns (uint256 payout)
```

multiply the difference of the payout by a constant and divide that result by the denominator subtract half of the difference between the two days to find the possible lower bound

#### Parameters

<br/>

|Name      |Type   |Description                                         |
|----------|-------|----------------------------------------------------|
|startDay  |uint256|the day to start counting                           |
|untilDay  |uint256|the day to stop counting                            |
|multiplier|uint256|a number to multiply by the difference of the payout|

<br/>

### \_storeDay

```
function _storeDay(uint256 day, struct EarningsOracle.Total _total) internal returns (struct EarningsOracle.Total total)
```

store the payout total for a given day. day must be the next day in the sequence (start with 0) day must have data available to read from the hex contract

\_the _total arg must be handled internally - cannot be passed from external_

#### Parameters

<br/>

|Name   |Type                       |Description           |
|-------|---------------------------|----------------------|
|day    |uint256                    |the day being targeted|
|\_total|struct EarningsOracle.Total|<br/>                 |

<br/>

### \_readTotals

```
function _readTotals(uint256 day, struct EarningsOracle.Total _total) internal view returns (uint256 payout, uint256 shares)
```

### \_saveDay

```
function _saveDay(uint256 payout, uint256 shares) internal returns (struct EarningsOracle.Total total)
```

### storeDay

```
function storeDay(uint256 day) external returns (struct EarningsOracle.Total total)
```

store a singular day, only the next day in the sequence is allowed

#### Parameters

<br/>

|Name|Type   |Description     |
|----|-------|----------------|
|day |uint256|the day to store|

<br/>

### incrementDay

```
function incrementDay() external returns (struct EarningsOracle.Total total, uint256 day)
```

checks the current day and increments the stored days if not yet covered

### \_storeDays

```
function _storeDays(uint256 startDay, uint256 untilDay) internal returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. untilDay is exclusive unless startDay and untilDay match

#### Parameters

<br/>

|Name    |Type   |Description                             |
|--------|-------|----------------------------------------|
|startDay|uint256|the day to start storing day information|
|untilDay|uint256|the day to stop storing day information |

<br/>

### storeDays

```
function storeDays(uint256 startDay, uint256 untilDay) external returns (struct EarningsOracle.Total total, uint256 day)
```

store a range of day payout information. range is not constrained by max catch up days constant nor is it constrained to the current day so if it goes beyond the current day or has not yet been stored then it is subject to failure

#### Parameters

<br/>

|Name    |Type   |Description                                                    |
|--------|-------|---------------------------------------------------------------|
|startDay|uint256|the day to start storing day information                       |
|untilDay|uint256|the day to stop storing day information. Until day is inclusive|

<br/>

### catchUpDays

```
function catchUpDays(uint256 iterations) external returns (struct EarningsOracle.Total total, uint256 day)
```

catch up the contract by reading up to 1\_000 days of payout information at a time

#### Parameters

<br/>

|Name      |Type   |Description                                                                           |
|----------|-------|--------------------------------------------------------------------------------------|
|iterations|uint256|the maximum number of days to iterate over - capped at 1\_000 due to sload constraints|

<br/>

### \_validateTotals

```
function _validateTotals(uint256 payout, uint256 shares) internal pure virtual
```

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

## ExistingStakeManager

## GoodAccounting

### checkStakeGoodAccounting

```
function checkStakeGoodAccounting(uint256 stakeId) external
```

check that the provided stake can be ended and end it

#### Parameters

<br/>

|Name   |Type   |Description                                      |
|-------|-------|-------------------------------------------------|
|stakeId|uint256|the stake id to end as custodied by this contract|

<br/>

### checkStakeGoodAccountingFor

```
function checkStakeGoodAccountingFor(address staker, uint256 index, uint256 stakeId) external
```

check that the stake can be good accounted, and execute the method if it will not fail

#### Parameters

<br/>

|Name   |Type   |Description                        |
|-------|-------|-----------------------------------|
|staker |address|the custodian of the provided stake|
|index  |uint256|the index of the stake             |
|stakeId|uint256|the stake id of the stake          |

<br/>

### isGoodAccountable

```
function isGoodAccountable(address staker, uint256 index, uint256 stakeId) external view returns (enum GoodAccounting.GoodAccountingStatus)
```

run the appropriate checks if the stake is good accountable. return 0 if it can be good accounted return other numbers for those failed conditions

#### Parameters

<br/>

|Name   |Type   |Description                        |
|-------|-------|-----------------------------------|
|staker |address|the custodian of the provided stake|
|index  |uint256|the index of the stake             |
|stakeId|uint256|the stake id of the stake          |

<br/>

### isStakeIdGoodAccountable

```
function isStakeIdGoodAccountable(uint256 stakeId) external view returns (enum GoodAccounting.GoodAccountingStatus)
```

### GoodAccountingStatus

```
enum GoodAccountingStatus {
  READY,
  ENDED,
  EARLY,
  MISMATCH,
  MISCOUNT
}
```

### \_isGoodAccountable

```
function _isGoodAccountable(address staker, uint256 index, uint256 stakeId) internal view returns (enum GoodAccounting.GoodAccountingStatus)
```

### \_checkStakeGoodAccounting

```
function _checkStakeGoodAccounting(address staker, uint256 index, uint256 stakeId) internal
```

### stakeGoodAccounting

```
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

<br/>

|Name        |Type   |Description                                            |
|------------|-------|-------------------------------------------------------|
|stakerAddr  |address|the originating stake address                          |
|stakeIndex  |uint256|the index of the stake on the address                  |
|stakeIdParam|uint40 |the stake id to verify the same stake is being targeted|

<br/>

### \_stakeGoodAccounting

```
function _stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint256 stakeIdParam) internal
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

<br/>

|Name        |Type   |Description                                            |
|------------|-------|-------------------------------------------------------|
|stakerAddr  |address|the originating stake address                          |
|stakeIndex  |uint256|the index of the stake on the address                  |
|stakeIdParam|uint256|the stake id to verify the same stake is being targeted|

<br/>

## HSIStakeManager

### defaultEncodedSettings

```
function defaultEncodedSettings() external pure returns (uint256)
```

#### Return Values

<br/>

|Name |Type   |Description                                                           |
|-----|-------|----------------------------------------------------------------------|
|\[0\]|uint256|the default encoded settings used by end stakers to tip and end stakes|

<br/>

### \_defaultSettings

```
function _defaultSettings() internal pure returns (struct EncodableSettings.Settings)
```

gets default settings struct

#### Return Values

<br/>

|Name |Type                             |Description|
|-----|---------------------------------|-----------|
|\[0\]|struct EncodableSettings.Settings|<br/>      |

<br/>

### depositHsi

```
function depositHsi(uint256 tokenId, uint256 encodedSettings) external returns (address hsiAddress)
```

transfer stakes by their token ids

_requires approval to transfer hsi to this contract_

#### Parameters

<br/>

|Name           |Type   |Description                          |
|---------------|-------|-------------------------------------|
|tokenId        |uint256|the token id to move to this contract|
|encodedSettings|uint256|<br/>                                |

<br/>

### \_deposit721

```
function _deposit721(address token, uint256 tokenId) internal returns (address owner)
```

### hsiAddressToId

```
function hsiAddressToId(address hsiAddress) external view returns (uint256)
```

### \_hsiAddressToId

```
function _hsiAddressToId(address hsiAddress) internal view returns (uint256)
```

### withdrawHsi

```
function withdrawHsi(address hsiAddress) external returns (uint256 tokenId)
```

### \_withdraw721

```
function _withdraw721(uint256 index, address owner, address hsiAddress) internal returns (uint256 tokenId)
```

### hsiStakeEndMany

```
function hsiStakeEndMany(address[] hsiAddresses) external
```

### \_verifyStakeMatchesIndex

```
function _verifyStakeMatchesIndex(uint256, uint256 stakeId) internal view returns (struct IUnderlyingStakeable.StakeStore stake)
```

### \_stakeEnd

```
function _stakeEnd(uint256 index, uint256 stakeId, uint256 stakeCountAfter) internal returns (uint256 targetReward)
```

### \_stakeStartFor

```
function _stakeStartFor(address staker, uint256 newStakeAmount, uint256 newStakeDays, uint256 index) internal returns (uint256 stakeId)
```

### \_mintHedron

```
function _mintHedron(uint256 index, uint256 stakeId) internal returns (uint256)
```

### \_checkStakeCustodian

```
function _checkStakeCustodian(uint256 stakeId) internal view
```

check that this contract is the custodian of this hsi (nft was depostied and detokenized)

#### Parameters

<br/>

|Name   |Type   |Description                         |
|-------|-------|------------------------------------|
|stakeId|uint256|the stake id to check ownership over|

<br/>

## IsolatedStakeManager

### constructor

```
constructor(address account) public
```

### setAuthorization

```
function setAuthorization(address account, uint256 setting) external
```

set authorization flags for a provided target

#### Parameters

<br/>

|Name   |Type   |Description                                                |
|-------|-------|-----------------------------------------------------------|
|account|address|the address to change settings for                         |
|setting|uint256|the encoded setting (binary) to apply to the target address|

<br/>

### setStartAuthorization

```
function setStartAuthorization(address runner, uint16 stakeDays, uint256 setting) external
```

allow addresses to start stakes from tokens already in the contract

#### Parameters

<br/>

|Name     |Type   |Description                                                                  |
|---------|-------|-----------------------------------------------------------------------------|
|runner   |address|the anticipated address(es) that will be running the following method        |
|stakeDays|uint16 |the number of days that can be passed for the address (to constrain griefing)|
|setting  |uint256|the settings to provide (only index 0 is relevant)                           |

<br/>

### startAuthorizationKey

```
function startAuthorizationKey(address runner, uint256 stakeDays) external pure returns (bytes32)
```

gets the start authorization key given a runner and stake days

#### Parameters

<br/>

|Name     |Type   |Description                                                                  |
|---------|-------|-----------------------------------------------------------------------------|
|runner   |address|the anticipated address(es) that will be running the following method        |
|stakeDays|uint256|the number of days that can be passed for the address (to constrain griefing)|

<br/>

### stakeStart

```
function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external
```

stake a given amount of tokens for a given number of days if 0 is provided then the balance of the contract will be utilized this should generally only be used if tokens are sent to the contract and end stakes are not occuring for a number of days if you do not have global start abilities, but do have scoped abilities it is not rational to pass anything but zero for this method

#### Parameters

<br/>

|Name           |Type   |Description                            |
|---------------|-------|---------------------------------------|
|newStakedHearts|uint256|the number of hearts to stake          |
|newStakedDays  |uint256|the number of days to stake said hearts|

<br/>

### stakeStartWithAuthorization

```
function stakeStartWithAuthorization(uint256 newStakedDays) external
```

start a stakes, so long as sender has the authorization to do so from owner

#### Parameters

<br/>

|Name         |Type   |Description                        |
|-------------|-------|-----------------------------------|
|newStakedDays|uint256|the number of days to start a stake|

<br/>

### transferFromOwner

```
function transferFromOwner(uint256 newStakedHearts) external
```

transfer a number of hearts from the owner into the contract authorization occurs inside of the internal method

#### Parameters

<br/>

|Name           |Type   |Description                              |
|---------------|-------|-----------------------------------------|
|newStakedHearts|uint256|number of hearts to deposit into contract|

<br/>

### stakeEnd

```
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external
```

ends the stake on the underlying target contract (HEX) and transfers tokens to the owner this method fails if the stake at the provided index does not match the stakeId

#### Parameters

<br/>

|Name      |Type   |Description                             |
|----------|-------|----------------------------------------|
|stakeIndex|uint256|the index of the stake in ownership list|
|stakeId   |uint40 |the id held on the stake                |

<br/>

### transferToOwner

```
function transferToOwner() external payable
```

transfers tokens to the owner of the contract

### checkAndStakeEnd

```
function checkAndStakeEnd(uint256 stakeIndex, uint40 stakeId) external
```

ends the stake on the underlying target contract (HEX) and transfers tokens to the owner this method does not fail if the stake at the provided index does not have the provided stake id this method does not fail if authorization is not provided to the runner of this method this is to give every opportunity for strangers (who are authorized) to end stakes without risk of losing too much gas money

#### Parameters

<br/>

|Name      |Type   |Description                             |
|----------|-------|----------------------------------------|
|stakeIndex|uint256|the index of the stake in ownership list|
|stakeId   |uint40 |the id held on the stake                |

<br/>

### \_endStake

```
function _endStake(uint256 stakeIndex, uint40 stakeId) internal
```

ends a stake on the underlying contract this will fail on the underlying if the stakeIndex and stakeId does not match

#### Parameters

<br/>

|Name      |Type   |Description       |
|----------|-------|------------------|
|stakeIndex|uint256|stake index to end|
|stakeId   |uint40 |stake id to end   |

<br/>

### \_transferToOwner

```
function _transferToOwner() internal
```

transfer balance to the owner of this contract

### \_settingsCheck

```
function _settingsCheck(struct IUnderlyingStakeable.StakeStore stake) internal view returns (bool)
```

check the settings of the running address

#### Parameters

<br/>

|Name |Type                                  |Description                          |
|-----|--------------------------------------|-------------------------------------|
|stake|struct IUnderlyingStakeable.StakeStore|the stake to check authorization over|

<br/>

### \_startAuthorizationKey

```
function _startAuthorizationKey(address runner, uint256 stakeDays) internal pure returns (bytes32)
```

get the start authorization key for an address and number of stake days

#### Parameters

<br/>

|Name     |Type   |Description                         |
|---------|-------|------------------------------------|
|runner   |address|the address that will run the method|
|stakeDays|uint256|the number of days to stake         |

<br/>

### \_stakeStart

```
function _stakeStart(uint256 newStakedDays) internal
```

starts a stake on the underlying contract for a given number of days

#### Parameters

<br/>

|Name         |Type   |Description                          |
|-------------|-------|-------------------------------------|
|newStakedDays|uint256|a number of days to start a stake for|

<br/>

### \_transferFromOwner

```
function _transferFromOwner(uint256 amount) internal
```

transfer a number of hearts from the owner to this contract

#### Parameters

<br/>

|Name  |Type   |Description                            |
|------|-------|---------------------------------------|
|amount|uint256|number of hearts to transfer from owner|

<br/>

## IsolatedStakeManagerFactory

### CreateIsolatedStakeManager

```
event CreateIsolatedStakeManager(address owner, address instance)
```

### isolatedStakeManagers

```
mapping(address => address) isolatedStakeManagers
```

a mapping of a key that contains a modifier and the owning address pointing to the address of the contract created by the stake manager

### createIsolatedManager

```
function createIsolatedManager(address staker) external returns (address existing)
```

## Magnitude

### MULTIPLIER

```
uint256 MULTIPLIER
```

### X\_OPTIONS

```
uint256 X_OPTIONS
```

### \_computeDayMagnitude

```
function _computeDayMagnitude(uint256 limit, uint256 method, uint256 x, uint256 today, uint256 lockedDay, uint256 stakedDays) internal pure returns (uint256 amount)
```

### \_computeMagnitude

```
function _computeMagnitude(uint256 limit, uint256 method, uint256 x, uint256 y2, uint256 y1) internal pure returns (uint256 amount)
```

compute a useful value from 2 inputs funds may never be linked to x variable. X should only hold data that we can plug into an expression to tell us where to land on the plot. Result is never less than 0, nor greater than limit

#### Parameters

<br/>

|Name  |Type   |Description                                                                  |
|------|-------|-----------------------------------------------------------------------------|
|limit |uint256|<br/>                                                                        |
|method|uint256|the method to use to compute a result                                        |
|x     |uint256|a primary magnitude to use - a constant held in settings - max value (2^64)-1|
|y2    |uint256|a secondary magnitude to use - generally the amount of the end stake         |
|y1    |uint256|the starting point of y2 used for deltas                                     |

<br/>

### \_yDeltas

```
function _yDeltas(uint256 method, uint256 y2, uint256 y1) internal pure returns (uint256 y)
```

### encodeLinear

```
function encodeLinear(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) external pure returns (uint256 encodedMethod, uint256 encodedMagnitude)
```

### \_encodeLinear

```
function _encodeLinear(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) internal pure returns (uint256 encodedMethod, uint256 encodedMagnitude)
```

convert an x/y+b line into a number held in under 72 total bits

#### Parameters

<br/>

|Name   |Type   |Description                                                |
|-------|-------|-----------------------------------------------------------|
|method |uint256|the method to use (total, principle, yield) when choosing x|
|xFactor|uint256|the scaling factor of x                                    |
|x      |int256 |the x value to use, which will multiply against input      |
|yFactor|uint256|the scaling factor of y                                    |
|y      |uint256|the y value to use to divide x\*input                      |
|bFactor|uint256|the scaling factor of b                                    |
|b      |int256 |the y intercept                                            |

<br/>

#### Return Values

<br/>

|Name            |Type   |Description                                                         |
|----------------|-------|--------------------------------------------------------------------|
|encodedMethod   |uint256|the encoded method which can be further encoded using settings uint8|
|encodedMagnitude|uint256|the encoded numbers describing (x/y)+b                              |

<br/>

### decodeLinear

```
function decodeLinear(uint256 method, uint256 magnitude) external pure returns (int256 x, uint256 y, int256 b)
```

decode an b+(x/y) slope from a number and scale it to your preference this limits the bFactor from scaling beyond 2^84, which should be enough for most use cases

#### Parameters

<br/>

|Name     |Type   |Description                              |
|---------|-------|-----------------------------------------|
|method   |uint256|scales the y intercept                   |
|magnitude|uint256|the uint256 number to decode into b+(x/y)|

<br/>

#### Return Values

<br/>

|Name|Type   |Description           |
|----|-------|----------------------|
|x   |int256 |the rise of the line  |
|y   |uint256|the run of the line   |
|b   |int256 |the offset of the line|

<br/>

### \_decodeLinear

```
function _decodeLinear(uint256 method, uint256 magnitude) internal pure returns (int256 x, uint256 y, int256 b)
```

decodes an embeded xy+b equation from encoded method and magnitude

#### Parameters

<br/>

|Name     |Type   |Description                                                         |
|---------|-------|--------------------------------------------------------------------|
|method   |uint256|the factor to raise a constant multipler to expand the b value.     |
|magnitude|uint256|an encoded number with b,x,y each uint16 prefixed by scales in uint8|

<br/>

#### Return Values

<br/>

|Name|Type   |Description                                                                                 |
|----|-------|--------------------------------------------------------------------------------------------|
|x   |int256 |the run that a value will be multiplied by                                                  |
|y   |uint256|the rise that a value can be divided by                                                     |
|b   |int256 |an offset or y intercept that can displace the ((x+b)/y) in a positive or negative direction|

<br/>

### computeMagnitude

```
function computeMagnitude(uint256 limit, uint256 method, uint256 x, uint256 y2, uint256 y1) external pure returns (uint256 result)
```

compute a magnitude given an x and y

#### Parameters

<br/>

|Name  |Type   |Description                                         |
|------|-------|----------------------------------------------------|
|limit |uint256|a limit that the uint result can not be greater than|
|method|uint256|the method to use to compute the result             |
|x     |uint256|the first value as input                            |
|y2    |uint256|the second value as input                           |
|y1    |uint256|the stake to use as an input for the second value   |

<br/>

### computeDayMagnitude

```
function computeDayMagnitude(uint256 limit, uint256 method, uint256 x, uint256 today, uint256 lockedDay, uint256 stakedDays) external pure returns (uint256 result)
```

compute a day magnitude given an x and y

#### Parameters

<br/>

|Name      |Type   |Description                                         |
|----------|-------|----------------------------------------------------|
|limit     |uint256|a limit that the uint result can not be greater than|
|method    |uint256|the method to use to compute the result             |
|x         |uint256|the first value as input                            |
|today     |uint256|the hex day value                                   |
|lockedDay |uint256|the day that the stake was locked                   |
|stakedDays|uint256|the number of full days that the stake was locked   |

<br/>

## MaximusStakeManager

### externalPerpetualSetter

```
address externalPerpetualSetter
```

### externalPerpetualFilter

```
address externalPerpetualFilter
```

### perpetualWhitelist

```
mapping(address => bool) perpetualWhitelist
```

### rewardsTo

```
mapping(address => mapping(uint256 => address)) rewardsTo
```

bytes32 is a key made up of the perpetual whitelist address + the iteration of the stake found at

### AddPerpetual

```
event AddPerpetual(address perpetual)
```

emitted when a contract is added to the whitelist

#### Parameters

<br/>

|Name     |Type   |Description                                  |
|---------|-------|---------------------------------------------|
|perpetual|address|the perpetual contract added to the whitelist|

<br/>

### CollectReward

```
event CollectReward(address perpetual, uint256 period, address token, uint256 amount)
```

collect a reward from a given perpetual within a period

#### Parameters

<br/>

|Name     |Type   |Description                                    |
|---------|-------|-----------------------------------------------|
|perpetual|address|the perpetual contract being targeted          |
|period   |uint256|the period, managed internally by the perpetual|
|token    |address|the token being rewarded                       |
|amount   |uint256|the amount of a token being rewarded           |

<br/>

### DistributeReward

```
event DistributeReward(address perpetual, uint256 period, address token, uint256 amount)
```

notes that a reward is being distributed to a given address, which previously ended a perpetual contract's stake

#### Parameters

<br/>

|Name     |Type   |Description                           |
|---------|-------|--------------------------------------|
|perpetual|address|the address of the perpetual contract |
|period   |uint256|the period being rewarded             |
|token    |address|the token being rewarded              |
|amount   |uint256|the amount of the token being rewarded|

<br/>

### constructor

```
constructor() public
```

a list of known perpetual contracts is set during constructor

### setExternalPerpetualFilter

```
function setExternalPerpetualFilter(address _externalPerpetualFilter) external
```

sets the extended perpetual filter to allow for other perpetual contracts to pass through the filter and added at a later date

#### Parameters

<br/>

|Name                     |Type   |Description                                                      |
|-------------------------|-------|-----------------------------------------------------------------|
|\_externalPerpetualFilter|address|the extended perpetual filter set by the creator of this contract|

<br/>

### checkPerpetual

```
function checkPerpetual(address perpetual) external returns (bool isPerpetual)
```

check if a given contract can pass through the perpetual filter

#### Parameters

<br/>

|Name     |Type   |Description                    |
|---------|-------|-------------------------------|
|perpetual|address|the perpetual contract to check|

<br/>

#### Return Values

<br/>

|Name       |Type|Description                                                  |
|-----------|----|-------------------------------------------------------------|
|isPerpetual|bool|when address has passed through the filter or extended filter|

<br/>

### \_checkPerpetual

```
function _checkPerpetual(address perpetual) internal returns (bool isPerpetual)
```

check if a given contract can pass through the perpetual filter

#### Parameters

<br/>

|Name     |Type   |Description                    |
|---------|-------|-------------------------------|
|perpetual|address|the perpetual contract to check|

<br/>

#### Return Values

<br/>

|Name       |Type|Description                                                                                                              |
|-----------|----|-------------------------------------------------------------------------------------------------------------------------|
|isPerpetual|bool|when address has passed through the filter or extended filter after passing through extended filter, the result is cached|

<br/>

### \_addPerpetual

```
function _addPerpetual(address perpetual) internal
```

adds new perpetual contract to the whitelist Once a perpetual is whitelisted it cannot be removed

#### Parameters

<br/>

|Name     |Type   |Description                                           |
|---------|-------|------------------------------------------------------|
|perpetual|address|the perpetual address to add to the persistant mapping|

<br/>

### stakeEndAs

```
function stakeEndAs(address rewarded, address perpetual, uint256 stakeId) external
```

end a stake on a known perpetual

#### Parameters

<br/>

|Name     |Type   |Description                      |
|---------|-------|---------------------------------|
|rewarded |address|the address to reward with tokens|
|perpetual|address|the perpetual to end a stake on  |
|stakeId  |uint256|the stake id to end              |

<br/>

### \_checkEndable

```
function _checkEndable(contract IPublicEndStakeable endable) internal view returns (bool isEndable)
```

checks if a given perpetual is endable

#### Parameters

<br/>

|Name   |Type                        |Description                   |
|-------|----------------------------|------------------------------|
|endable|contract IPublicEndStakeable|the endable perpetual contract|

<br/>

#### Return Values

<br/>

|Name     |Type|Description                                |
|---------|----|-------------------------------------------|
|isEndable|bool|denotes whether or not the stake is endable|

<br/>

### checkEndable

```
function checkEndable(address endable) external view returns (bool isEndable)
```

checks if a given perpetual is endable

#### Parameters

<br/>

|Name   |Type   |Description                   |
|-------|-------|------------------------------|
|endable|address|the endable perpetual contract|

<br/>

#### Return Values

<br/>

|Name     |Type|Description                                  |
|---------|----|---------------------------------------------|
|isEndable|bool|verifies that the provided address is endable|

<br/>

### flush

```
function flush(address gasReimberser, address perpetual, uint256 period, address[] tokens) external
```

flush erc20 tokens into this contract this assumes that only one token is flushed at a time accounting will be lost if this patterns is broken by distribution tokens or perpetual sending more than one token at a time

_this method should not be chained to a stake end - it should be done in a separate transaction_

#### Parameters

<br/>

|Name         |Type       |Description                                    |
|-------------|-----------|-----------------------------------------------|
|gasReimberser|address    |the address to collect gas reimbersement from  |
|perpetual    |address    |the perpetual pool to call flush on            |
|period       |uint256    |the period that the token collects against     |
|tokens       |address\[\]|the token addresses to flush into this contract|

<br/>

## MulticallExtension

this multicall extension is useful for chaining permissioned calls in other words, calls that operate on the senders funds or settings

### BlockHash

```
error BlockHash(bytes32 expected, bytes32 actual)
```

### Deadline

```
error Deadline(uint256 deadline, uint256 currentTime)
```

### TxFailed

```
event TxFailed(uint256 index, bytes result)
```

### multicall

```
function multicall(bytes[] calls, bool allowFailures) external
```

call a series of functions on a contract that inherits this method

#### Parameters

<br/>

|Name         |Type     |Description                              |
|-------------|---------|-----------------------------------------|
|calls        |bytes\[\]|the calls to perform on this contract    |
|allowFailures|bool     |whether to allow failures or to error out|

<br/>

### multicallWithDeadline

```
function multicallWithDeadline(uint256 deadline, bytes[] calls, bool allowFailures) external
```

call multiple methods and pass a deadline, after which the transaction should fail

#### Parameters

<br/>

|Name         |Type     |Description                               |
|-------------|---------|------------------------------------------|
|deadline     |uint256  |the timestamp, in seconds                 |
|calls        |bytes\[\]|the calldata to run on the external method|
|allowFailures|bool     |allows failures when true                 |

<br/>

### multicallWithPreviousBlockHash

```
function multicallWithPreviousBlockHash(bytes32 previousBlockhash, bytes[] calls, bool allowFailures) external
```

pass the previous block hash to enable mev uncle bandit protection

#### Parameters

<br/>

|Name             |Type     |Description                                                             |
|-----------------|---------|------------------------------------------------------------------------|
|previousBlockhash|bytes32  |the previously mined block - useful for mev protected uncle bandit risks|
|calls            |bytes\[\]|the calldata to run on the external method                              |
|allowFailures    |bool     |allows failures when true                                               |

<br/>

### \_multicall

```
function _multicall(bytes[] calls, bool allowFailures) internal
```

call multiple / arbitrary steps allowing each to fail independently or requiring all to succeed while the method is payable, this is only for gas optimization purposes no value is passable, nor should it be used in any of the required contracts

#### Parameters

<br/>

|Name         |Type     |Description                                                           |
|-------------|---------|----------------------------------------------------------------------|
|calls        |bytes\[\]|the sequence of calls that is requested                               |
|allowFailures|bool     |allows the calls to fail separately or requires all to succeed or fail|

<br/>

## SingletonHedronManager

### createTo

```
function createTo(uint256 setting, address owner) external pure returns (uint256 to)
```

### \_createTo

```
function _createTo(uint256 setting, address owner) internal pure returns (uint256 to)
```

### mintHedronRewards

```
function mintHedronRewards(uint256[] stakeIds) external
```

mint rewards and transfer them to a provided address any combination of owners can be passed, however, it is most efficient to order the hsi address by owner

#### Parameters

<br/>

|Name    |Type       |Description              |
|--------|-----------|-------------------------|
|stakeIds|uint256\[\]|list of stake ids to mint|

<br/>

### \_mintHedron

```
function _mintHedron(uint256 index, uint256 stakeId) internal virtual returns (uint256 amount)
```

### \_mintNativeHedron

```
function _mintNativeHedron(uint256 index, uint256 stakeId) internal returns (uint256 amount)
```

### \_mintInstancedHedron

```
function _mintInstancedHedron(uint256 index, address hsiAddress) internal returns (uint256 amount)
```

## StakeEnder

### INDEX\_TODAY

```
uint8 INDEX_TODAY
```

### stakeEndByConsent

```
function stakeEndByConsent(uint256 stakeId) external payable returns (uint256 delta, uint256 count)
```

end a stake for someone other than the sender of the transaction

#### Parameters

<br/>

|Name   |Type   |Description                                   |
|-------|-------|----------------------------------------------|
|stakeId|uint256|the stake id on the underlying contract to end|

<br/>

### \_verifyStakeMatchesIndex

```
function _verifyStakeMatchesIndex(uint256 index, uint256 stakeId) internal view virtual returns (struct IUnderlyingStakeable.StakeStore stake)
```

### \_stakeEndByConsent

```
function _stakeEndByConsent(uint256 stakeId, uint256 _count) internal returns (uint256 delta, uint256 count)
```

end a stake with the consent of the underlying staker's settings hedron minting happens as last step before end stake

_the stake count is today | stake count because if there were 2 variables, the contract ended up too large_

#### Parameters

<br/>

|Name   |Type   |Description        |
|-------|-------|-------------------|
|stakeId|uint256|the stake id to end|
|\_count|uint256|<br/>              |

<br/>

#### Return Values

<br/>

|Name |Type   |Description                              |
|-----|-------|-----------------------------------------|
|delta|uint256|the amount of hex at the end of the stake|
|count|uint256|<br/>                                    |

<br/>

### stakeEndByConsentForMany

```
function stakeEndByConsentForMany(uint256[] stakeIds) external payable
```

end many stakes at the same time provides an optimized path for all stake ends and assumes that detectable failures should be skipped this method should, generally, only be called when multiple enders are attempting to end stake the same stakes

#### Parameters

<br/>

|Name    |Type       |Description     |
|--------|-----------|----------------|
|stakeIds|uint256\[\]|stake ids to end|

<br/>

### \_stakeEnd

```
function _stakeEnd(uint256 stakeIndex, uint256 stakeId, uint256 stakeCountAfter) internal virtual returns (uint256)
```

ends a stake for someone else

#### Parameters

<br/>

|Name           |Type   |Description                                                  |
|---------------|-------|-------------------------------------------------------------|
|stakeIndex     |uint256|the stake index on the underlying contract to end            |
|stakeId        |uint256|the stake id on the underlying contract to end               |
|stakeCountAfter|uint256|the stake count after the stake is ended (current length - 1)|

<br/>

#### Return Values

<br/>

|Name |Type   |Description|
|-----|-------|-----------|
|\[0\]|uint256|<br/>      |

<br/>

## StakeInfo

### stakeIdInfo

```
mapping(uint256 => uint256) stakeIdInfo
```

the owner of a stake indexed by the stake id index + 160(owner)

### StakeNotOwned

```
error StakeNotOwned(address provided, address expected)
```

this error is thrown when the stake in question is not owned by the expected address

### StakeNotCustodied

```
error StakeNotCustodied(uint256 stakeId)
```

### verifyStakeOwnership

```
function verifyStakeOwnership(address owner, uint256 stakeId) external view
```

verify the ownership of a stake given its id error occurs if owner does not match

#### Parameters

<br/>

|Name   |Type   |Description                    |
|-------|-------|-------------------------------|
|owner  |address|the supposed owner of the stake|
|stakeId|uint256|the id of the stake in question|

<br/>

### \_verifyStakeOwnership

```
function _verifyStakeOwnership(address owner, uint256 stakeId) internal view
```

verify the ownership of a stake given its id StakeNotOwned error occurs if owner does not match

#### Parameters

<br/>

|Name   |Type   |Description                    |
|-------|-------|-------------------------------|
|owner  |address|the supposed owner of the stake|
|stakeId|uint256|the id of the stake in question|

<br/>

### verifyCustodian

```
function verifyCustodian(uint256 stakeId) external view
```

verify that this contract knows the owner of a given stake id and is acting as custodian for said owner StakeNotCustodied error occurs if owner is not known

#### Parameters

<br/>

|Name   |Type   |Description                              |
|-------|-------|-----------------------------------------|
|stakeId|uint256|the stake id to verify custodialship over|

<br/>

### \_verifyCustodian

```
function _verifyCustodian(uint256 stakeId) internal view
```

verify that this contract knows the owner of a given stake id and is acting as custodian for said owner StakeNotCustodied error occurs if owner is not known

#### Parameters

<br/>

|Name   |Type   |Description                              |
|-------|-------|-----------------------------------------|
|stakeId|uint256|the stake id to verify custodialship over|

<br/>

### stakeIdToOwner

```
function stakeIdToOwner(uint256 stakeId) external view returns (address owner)
```

get the owner of the stake id - the account that has rights over the stake's settings and ability to end it outright value will be address(0) for unknown

#### Parameters

<br/>

|Name   |Type   |Description             |
|-------|-------|------------------------|
|stakeId|uint256|the stake id in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                    |
|-----|-------|-------------------------------|
|owner|address|of the stake at the provided id|

<br/>

### \_stakeIdToOwner

```
function _stakeIdToOwner(uint256 stakeId) internal view returns (address owner)
```

access the owner of a given stake id value will be address(0) for unknown

#### Parameters

<br/>

|Name   |Type   |Description             |
|-------|-------|------------------------|
|stakeId|uint256|the stake id in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description        |
|-----|-------|-------------------|
|owner|address|of a given stake id|

<br/>

### stakeIdToInfo

```
function stakeIdToInfo(uint256 stakeId) external view returns (uint256 index, address owner)
```

get the info of a stake given it's id. The index must match the index of the stake in the hex/hedron contract

#### Parameters

<br/>

|Name   |Type   |Description                 |
|-------|-------|----------------------------|
|stakeId|uint256|the stake id to get info for|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                    |
|-----|-------|-------------------------------|
|index|uint256|of the stake id in the hex list|
|owner|address|of the stake                   |

<br/>

### \_stakeIdToInfo

```
function _stakeIdToInfo(uint256 stakeId) internal view returns (uint256 index, address owner)
```

retrieve the index and owner of a stake id for a non custodied stake, the index is 0 and the owner is address(0)

#### Parameters

<br/>

|Name   |Type   |Description                    |
|-------|-------|-------------------------------|
|stakeId|uint256|the id of the stake in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                            |
|-----|-------|-------------------------------------------------------|
|index|uint256|the index of the stake in the hex list or the hsim list|
|owner|address|the owner of the stake                                 |

<br/>

### stakeIdToIndex

```
function stakeIdToIndex(uint256 stakeId) external view returns (uint256 index)
```

the index of the stake id - useful when indexes are moving around and could be moved by other people

#### Parameters

<br/>

|Name   |Type   |Description           |
|-------|-------|----------------------|
|stakeId|uint256|the stake id to target|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                      |
|-----|-------|---------------------------------|
|index|uint256|of the stake in the targeted list|

<br/>

### \_stakeIdToIndex

```
function _stakeIdToIndex(uint256 stakeId) internal view returns (uint256 index)
```

the index of the stake id - useful when indexes are moving around and could be moved by other people

#### Parameters

<br/>

|Name   |Type   |Description           |
|-------|-------|----------------------|
|stakeId|uint256|the stake id to target|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                      |
|-----|-------|---------------------------------|
|index|uint256|of the stake in the targeted list|

<br/>

### encodeInfo

```
function encodeInfo(uint256 index, address owner) external pure returns (uint256 info)
```

encode an index and owner pair to track under a single sload

#### Parameters

<br/>

|Name |Type   |Description         |
|-----|-------|--------------------|
|index|uint256|index of a stake    |
|owner|address|the owner of a stake|

<br/>

#### Return Values

<br/>

|Name|Type   |Description                                                   |
|----|-------|--------------------------------------------------------------|
|info|uint256|the encoded uint256 that can be decoded to the index and owner|

<br/>

### \_encodeInfo

```
function _encodeInfo(uint256 index, address owner) internal pure returns (uint256 info)
```

encode an index and owner pair to track under a single sload

#### Parameters

<br/>

|Name |Type   |Description         |
|-----|-------|--------------------|
|index|uint256|index of a stake    |
|owner|address|the owner of a stake|

<br/>

#### Return Values

<br/>

|Name|Type   |Description                                                   |
|----|-------|--------------------------------------------------------------|
|info|uint256|the encoded uint256 that can be decoded to the index and owner|

<br/>

## StakeManager

### constructor

```
constructor() public
```

## StakeStarter

### stakeStartFromBalanceFor

```
function stakeStartFromBalanceFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

stake a given number of tokens for a given number of days

#### Parameters

<br/>

|Name         |Type   |Description                         |
|-------------|-------|------------------------------------|
|to           |address|the address that will own the staker|
|amount       |uint256|the number of tokens to stake       |
|newStakedDays|uint256|the number of days to stake for     |
|settings     |uint256|<br/>                               |

<br/>

### stakeStartFromWithdrawableFor

```
function stakeStartFromWithdrawableFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

start a numbeer of stakes for an address from the withdrawable

#### Parameters

<br/>

|Name         |Type   |Description                              |
|-------------|-------|-----------------------------------------|
|to           |address|the account to start a stake for         |
|amount       |uint256|the number of tokens to start a stake for|
|newStakedDays|uint256|the number of days to stake for          |
|settings     |uint256|<br/>                                    |

<br/>

### stakeStartFromUnattributedFor

```
function stakeStartFromUnattributedFor(address to, uint256 amount, uint256 newStakedDays, uint256 settings) external payable returns (uint256 stakeId)
```

stake a number of tokens for a given number of days, pulling from the unattributed tokens in this contract

#### Parameters

<br/>

|Name         |Type   |Description                  |
|-------------|-------|-----------------------------|
|to           |address|the owner of the stake       |
|amount       |uint256|the amount of tokens to stake|
|newStakedDays|uint256|the number of days to stake  |
|settings     |uint256|<br/>                        |

<br/>

## Tipper

### INDEX\_EXTERNAL\_TIP\_CURRENCY

```
uint256 INDEX_EXTERNAL_TIP_CURRENCY
```

### INDEX\_EXTERNAL\_TIP\_CURRENCY\_ONLY

```
uint256 INDEX_EXTERNAL_TIP_CURRENCY_ONLY
```

### INDEX\_EXTERNAL\_TIP\_LIMIT

```
uint256 INDEX_EXTERNAL_TIP_LIMIT
```

### INDEX\_EXTERNAL\_TIP\_METHOD

```
uint256 INDEX_EXTERNAL_TIP_METHOD
```

### constructor

```
constructor() internal
```

### MAX\_256

```
uint256 MAX_256
```

### tipStakeIdToStaker

```
mapping(uint256 => address) tipStakeIdToStaker
```

### AddTip

```
event AddTip(uint256 stakeId, address token, uint256 index, uint256 setting)
```

### RemoveTip

```
event RemoveTip(uint256 stakeId, address token, uint256 index, uint256 setting)
```

### Tip

```
event Tip(uint256 stakeId, address staker, address token, uint256 amount)
```

tip an address a defined amount and token

#### Parameters

<br/>

|Name   |Type   |Description                |
|-------|-------|---------------------------|
|stakeId|uint256|the stake id being targeted|
|staker |address|the staker                 |
|token  |address|the token being accounted  |
|amount |uint256|the amount of the token    |

<br/>

### stakeIdTips

```
mapping(uint256 => uint256[]) stakeIdTips
```

### stakeIdTipSize

```
function stakeIdTipSize(uint256 stakeId) external view returns (uint256)
```

### \_stakeIdTipSize

```
function _stakeIdTipSize(uint256 stakeId) internal view returns (uint256)
```

### \_executeTipList

```
function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId) internal
```

### encodeTipSettings

```
function encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 fullEncodedLinear) external pure returns (uint256)
```

encodes a series of data in 32+96+64+64 to fit into 256 bits to define how a tip should be executed

#### Parameters

<br/>

|Name             |Type   |Description                              |
|-----------------|-------|-----------------------------------------|
|reusable         |bool   |<br/>                                    |
|currencyIndex    |uint256|the index of the currency on the list    |
|amount           |uint256|the number of tokens to delineate as tips|
|fullEncodedLinear|uint256|the method+xyb function to use           |

<br/>

### encodedLinearWithMethod

```
function encodedLinearWithMethod(uint256 method, uint256 xFactor, int256 x, uint256 yFactor, uint256 y, uint256 bFactor, int256 b) external pure returns (uint256)
```

### \_encodeTipSettings

```
function _encodeTipSettings(bool reusable, uint256 currencyIndex, uint256 amount, uint256 fullEncodedLinear) internal pure returns (uint256)
```

### depositAndAddTipToStake

```
function depositAndAddTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) external payable virtual returns (uint256, uint256)
```

### removeTipFromStake

```
function removeTipFromStake(uint256 stakeId, uint256[] indexes) external payable
```

### \_removeTipFromStake

```
function _removeTipFromStake(uint256 stakeId, uint256[] indexes) internal
```

### addTipToStake

```
function addTipToStake(bool reusable, address token, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) external payable virtual returns (uint256, uint256)
```

### \_verifyTipAmountAllowed

```
function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns (address recipient)
```

### \_checkStakeCustodian

```
function _checkStakeCustodian(uint256 stakeId) internal view virtual
```

### \_addTipToStake

```
function _addTipToStake(bool reusable, address token, address account, uint256 stakeId, uint256 amount, uint256 fullEncodedLinear) internal returns (uint256 index, uint256 tipAmount)
```

### receive

```
receive() external payable
```

## TransferrableStakeManager

### TransferStake

```
event TransferStake(uint256 stakeId, address owner)
```

### removeTransferrability

```
function removeTransferrability(uint256 stakeId) external payable returns (uint256 settings)
```

removes transfer abilities from a stake

#### Parameters

<br/>

|Name   |Type   |Description                                                                |
|-------|-------|---------------------------------------------------------------------------|
|stakeId|uint256|the stake that the sender owns and wishes to remove transfer abilities from|

<br/>

### \_updateTransferrability

```
function _updateTransferrability(uint256 stakeId, uint256 encoded) internal returns (uint256 settings)
```

### canTransfer

```
function canTransfer(uint256 stakeId) external view returns (bool)
```

### \_canTransfer

```
function _canTransfer(uint256 stakeId) internal view returns (bool)
```

### stakeTransfer

```
function stakeTransfer(uint256 stakeId, address to) external payable
```

## UnderlyingStakeManager

### \_stakeStartFor

```
function _stakeStartFor(address owner, uint256 amount, uint256 newStakedDays, uint256 index) internal virtual returns (uint256 stakeId)
```

start a stake for the staker given the amount and number of days

#### Parameters

<br/>

|Name         |Type   |Description                                                                                            |
|-------------|-------|-------------------------------------------------------------------------------------------------------|
|owner        |address|the underlying owner of the stake                                                                      |
|amount       |uint256|the amount to add to the stake                                                                         |
|newStakedDays|uint256|the number of days that the stake should run                                                           |
|index        |uint256|where in the list the stake will be placed. this is a param because it can be cached for internal loops|

<br/>

### \_stakeEnd

```
function _stakeEnd(uint256 stakeIndex, uint256 stakeId, uint256 stakeCountAfter) internal virtual returns (uint256 delta)
```

ends a stake for someone else

#### Parameters

<br/>

|Name           |Type   |Description                                                  |
|---------------|-------|-------------------------------------------------------------|
|stakeIndex     |uint256|the stake index on the underlying contract to end            |
|stakeId        |uint256|the stake id on the underlying contract to end               |
|stakeCountAfter|uint256|the stake count after the stake is ended (current length - 1)|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                                       |
|-----|-------|------------------------------------------------------------------|
|delta|uint256|the number of tokens that have been received from ending the stake|

<br/>

### stakeStart

```
function stakeStart(uint256 amount, uint256 newStakedDays) external virtual
```

starts a stake from the provided amount

_this method interface matches the original underlying token contract_

#### Parameters

<br/>

|Name         |Type   |Description                          |
|-------------|-------|-------------------------------------|
|amount       |uint256|amount of tokens to stake            |
|newStakedDays|uint256|the number of days for this new stake|

<br/>

### stakeEnd

```
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external virtual
```

end your own stake which is custodied by the stake manager. skips tip computing this is not payable to match the underlying contract this moves funds back to the sender to make behavior match underlying token this method only checks that the sender owns the stake it does not care if it is managed in a created contract and externally endable by this contract (1) or requires that the staker send start and end methods (0)

#### Parameters

<br/>

|Name      |Type   |Description                                           |
|----------|-------|------------------------------------------------------|
|stakeIndex|uint256|the index on the underlying contract to end stake     |
|stakeId   |uint40 |the stake id from the underlying contract to end stake|

<br/>

### \_stakeEndByIndexAndId

```
function _stakeEndByIndexAndId(uint256 stakeIndex, uint256 stakeId) internal virtual returns (uint256 amount)
```

### stakeEndById

```
function stakeEndById(uint256 stakeId) external virtual returns (uint256 amount)
```

end your own stake which is custodied by the stake manager. skips tip computing this is not payable to match the underlying contract this moves funds back to the sender to make behavior match underlying token this method only checks that the sender owns the stake it does not care if it is managed in a created contract and externally endable by this contract (1) or requires that the staker send start and end methods (0)

#### Parameters

<br/>

|Name   |Type   |Description                                           |
|-------|-------|------------------------------------------------------|
|stakeId|uint256|the stake id from the underlying contract to end stake|

<br/>

### \_stakeRestartById

```
function _stakeRestartById(uint256 stakeId) internal returns (uint256 amount, uint256 newStakeId)
```

given ownership over a stake, end the stake and restart all of the proceeds

#### Parameters

<br/>

|Name   |Type   |Description            |
|-------|-------|-----------------------|
|stakeId|uint256|the stake id to restart|

<br/>

#### Return Values

<br/>

|Name      |Type   |Description                   |
|----------|-------|------------------------------|
|amount    |uint256|the amount ended and re-staked|
|newStakeId|uint256|the newly recreated stake id  |

<br/>

### stakeRestartById

```
function stakeRestartById(uint256 stakeId) external returns (uint256 amount, uint256 newStakeId)
```

given ownership over a stake, stop and restart a stake with all proceeds

#### Parameters

<br/>

|Name   |Type   |Description            |
|-------|-------|-----------------------|
|stakeId|uint256|the stake id to restart|

<br/>

#### Return Values

<br/>

|Name      |Type   |Description                                                |
|----------|-------|-----------------------------------------------------------|
|amount    |uint256|the number of tokens that were ended and added to new stake|
|newStakeId|uint256|the newly created stake id                                 |

<br/>

### stakeRestartManyById

```
function stakeRestartManyById(uint256[] stakeIds) external
```

given ownership over a list of ids of stakes, restart a list of stakes

#### Parameters

<br/>

|Name    |Type       |Description                                      |
|--------|-----------|-------------------------------------------------|
|stakeIds|uint256\[\]|the list of stake ids to iterate over and restart|

<br/>

## UnderlyingStakeable

### \_getStake

```
function _getStake(address custodian, uint256 index) internal view virtual returns (struct IUnderlyingStakeable.StakeStore)
```

gets the stake store at the provided index

#### Parameters

<br/>

|Name     |Type   |Description                                     |
|---------|-------|------------------------------------------------|
|custodian|address|the custodian (usually this) whose list to check|
|index    |uint256|the index of the stake to get                   |

<br/>

#### Return Values

<br/>

|Name |Type                                  |Description                                |
|-----|--------------------------------------|-------------------------------------------|
|\[0\]|struct IUnderlyingStakeable.StakeStore|the stake on the list at the provided index|

<br/>

### stakeCount

```
function stakeCount(address staker) external view returns (uint256 count)
```

the count of stakes for a given custodian / staker

#### Parameters

<br/>

|Name  |Type   |Description              |
|------|-------|-------------------------|
|staker|address|the custodian in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                   |
|-----|-------|----------------------------------------------|
|count|uint256|of the stakes under a given custodian / staker|

<br/>

### \_stakeCount

```
function _stakeCount(address staker) internal view returns (uint256 count)
```

the count of stakes for a given custodian / staker

#### Parameters

<br/>

|Name  |Type   |Description              |
|------|-------|-------------------------|
|staker|address|the custodian in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                   |
|-----|-------|----------------------------------------------|
|count|uint256|of the stakes under a given custodian / staker|

<br/>

### balanceOf

```
function balanceOf(address owner) external view returns (uint256 amount)
```

retrieve the balance of a given owner

#### Parameters

<br/>

|Name |Type   |Description            |
|-----|-------|-----------------------|
|owner|address|the owner of the tokens|

<br/>

#### Return Values

<br/>

|Name  |Type   |Description     |
|------|-------|----------------|
|amount|uint256|a balance amount|

<br/>

### \_balanceOf

```
function _balanceOf(address owner) internal view returns (uint256 amount)
```

retrieve the balance of a given owner

#### Parameters

<br/>

|Name |Type   |Description            |
|-----|-------|-----------------------|
|owner|address|the owner of the tokens|

<br/>

#### Return Values

<br/>

|Name  |Type   |Description     |
|------|-------|----------------|
|amount|uint256|a balance amount|

<br/>

### stakeLists

```
function stakeLists(address staker, uint256 index) external view returns (struct IUnderlyingStakeable.StakeStore stake)
```

retrieve a stake at a staker's index given a staker address and an index

#### Parameters

<br/>

|Name  |Type   |Description           |
|------|-------|----------------------|
|staker|address|the staker in question|
|index |uint256|the index to focus on |

<br/>

#### Return Values

<br/>

|Name |Type                                  |Description                                           |
|-----|--------------------------------------|------------------------------------------------------|
|stake|struct IUnderlyingStakeable.StakeStore|the stake custodied by a given staker at a given index|

<br/>

### currentDay

```
function currentDay() external view returns (uint256 day)
```

retrieve the current day from the target contract

#### Return Values

<br/>

|Name|Type   |Description                                  |
|----|-------|---------------------------------------------|
|day |uint256|the current day according to the hex contract|

<br/>

### \_currentDay

```
function _currentDay() internal view returns (uint256)
```

retrieve the current day from the target contract

#### Return Values

<br/>

|Name |Type   |Description                                      |
|-----|-------|-------------------------------------------------|
|\[0\]|uint256|day the current day according to the hex contract|

<br/>

### globalInfo

```
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex) updated at the first start or end stake on any given day

### isEarlyEnding

```
function isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) external pure returns (bool isEarly)
```

check whether or not the stake is being ended early

#### Parameters

<br/>

|Name      |Type   |Description                                                    |
|----------|-------|---------------------------------------------------------------|
|lockedDay |uint256|the day after the stake was locked                             |
|stakedDays|uint256|the number of days that the stake is locked                    |
|targetDay |uint256|the day to check whether it will be categorized as ending early|

<br/>

#### Return Values

<br/>

|Name   |Type|Description                                                               |
|-------|----|--------------------------------------------------------------------------|
|isEarly|bool|the locked and staked days are greater than the target day (usually today)|

<br/>

### \_isEarlyEnding

```
function _isEarlyEnding(uint256 lockedDay, uint256 stakedDays, uint256 targetDay) internal pure returns (bool isEarly)
```

check whether or not the stake is being ended early

#### Parameters

<br/>

|Name      |Type   |Description                                                    |
|----------|-------|---------------------------------------------------------------|
|lockedDay |uint256|the day after the stake was locked                             |
|stakedDays|uint256|the number of days that the stake is locked                    |
|targetDay |uint256|the day to check whether it will be categorized as ending early|

<br/>

#### Return Values

<br/>

|Name   |Type|Description                                                               |
|-------|----|--------------------------------------------------------------------------|
|isEarly|bool|the locked and staked days are greater than the target day (usually today)|

<br/>

### stakeStart

```
function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external virtual
```

starts a stake from the provided amount

_this method interface matches the original underlying token contract_

#### Parameters

<br/>

|Name           |Type   |Description                          |
|---------------|-------|-------------------------------------|
|newStakedHearts|uint256|amount of tokens to stake            |
|newStakedDays  |uint256|the number of days for this new stake|

<br/>

### stakeEnd

```
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external virtual
```

end your own stake which is custodied by the stake manager. skips tip computing this is not payable to match the underlying contract this moves funds back to the sender to make behavior match underlying token this method only checks that the sender owns the stake it does not care if it is managed in a created contract and externally endable by this contract (1) or requires that the staker send start and end methods (0)

#### Parameters

<br/>

|Name      |Type   |Description                                           |
|----------|-------|------------------------------------------------------|
|stakeIndex|uint256|the index on the underlying contract to end stake     |
|stakeId   |uint40 |the stake id from the underlying contract to end stake|

<br/>

### stakeGoodAccounting

```
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external virtual
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

<br/>

|Name        |Type   |Description                       |
|------------|-------|----------------------------------|
|stakerAddr  |address|the custoidan of the stake        |
|stakeIndex  |uint256|the index of the stake in question|
|stakeIdParam|uint40 |the id of the stake               |

<br/>

## Utils

### NotAllowed

```
error NotAllowed()
```

### TARGET

```
address TARGET
```

### MAX\_DAYS

```
uint256 MAX_DAYS
```

### SLOTS

```
uint256 SLOTS
```

### TEN\_K

```
uint256 TEN_K
```

### ADDRESS\_BIT\_LENGTH

```
uint256 ADDRESS_BIT_LENGTH
```

### MIN\_INT\_16

```
int256 MIN_INT_16
```

### MAX\_UINT8

```
uint256 MAX_UINT8
```

### ZERO

```
uint256 ZERO
```

### ONE

```
uint256 ONE
```

### TWO

```
uint256 TWO
```

### THREE

```
uint256 THREE
```

### FOUR

```
uint256 FOUR
```

### EIGHT

```
uint256 EIGHT
```

### SIXTEEN

```
uint256 SIXTEEN
```

### TWENTY\_FOUR

```
uint256 TWENTY_FOUR
```

### THIRTY\_TWO

```
uint256 THIRTY_TWO
```

### FOURTY

```
uint256 FOURTY
```

### FOURTY\_EIGHT

```
uint256 FOURTY_EIGHT
```

### FIFTY\_SIX

```
uint256 FIFTY_SIX
```

### SEVENTY\_TWO

```
uint256 SEVENTY_TWO
```

### HEDRON

```
address HEDRON
```

### HSIM

```
address HSIM
```

### isOneAtIndex

```
function isOneAtIndex(uint256 setting, uint256 index) external pure returns (bool)
```

check if the number, in binary form, has a 1 at the provided index

#### Parameters

<br/>

|Name   |Type   |Description                                         |
|-------|-------|----------------------------------------------------|
|setting|uint256|the setting number that holds up to 256 flags as 1/0|
|index  |uint256|the index to check for a 1                          |

<br/>

### \_isOneAtIndex

```
function _isOneAtIndex(uint256 setting, uint256 index) internal pure returns (bool)
```

## IExternalPerpetualFilter

### verifyPerpetual

```
function verifyPerpetual(address perpetual) external view returns (bool isPerpetual)
```

## IGasReimberser

### flush

```
function flush() external
```

### flush\_erc20

```
function flush_erc20(address token) external
```

## IHEX

### XfLobbyEnter

```
event XfLobbyEnter(uint256 data0, address memberAddr, uint256 entryId, address referrerAddr)
```

### XfLobbyExit

```
event XfLobbyExit(uint256 data0, address memberAddr, uint256 entryId, address referrerAddr)
```

### DailyDataUpdate

```
event DailyDataUpdate(uint256 data0, address updaterAddr)
```

### Claim

```
event Claim(uint256 data0, uint256 data1, bytes20 btcAddr, address claimToAddr, address referrerAddr)
```

### ClaimAssist

```
event ClaimAssist(uint256 data0, uint256 data1, uint256 data2, address senderAddr)
```

### StakeStart

```
event StakeStart(uint256 data0, address stakerAddr, uint40 stakeId)
```

### StakeGoodAccounting

```
event StakeGoodAccounting(uint256 data0, uint256 data1, address stakerAddr, uint40 stakeId, address senderAddr)
```

### StakeEnd

```
event StakeEnd(uint256 data0, uint256 data1, address stakerAddr, uint40 stakeId)
```

### ShareRateChange

```
event ShareRateChange(uint256 data0, uint40 stakeId)
```

### stakeLists

```
function stakeLists(address staker, uint256 index) external view returns (struct IUnderlyingStakeable.StakeStore)
```

retrieve a stake at a staker's index given a staker address and an index

#### Parameters

<br/>

|Name  |Type   |Description           |
|------|-------|----------------------|
|staker|address|the staker in question|
|index |uint256|the index to focus on |

<br/>

#### Return Values

<br/>

|Name |Type                                  |Description                                                 |
|-----|--------------------------------------|------------------------------------------------------------|
|\[0\]|struct IUnderlyingStakeable.StakeStore|stake the stake custodied by a given staker at a given index|

<br/>

### currentDay

```
function currentDay() external view returns (uint256)
```

retrieve the current day from the target contract

#### Return Values

<br/>

|Name |Type   |Description                                      |
|-----|-------|-------------------------------------------------|
|\[0\]|uint256|day the current day according to the hex contract|

<br/>

### globalInfo

```
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex) updated at the first start or end stake on any given day

### dailyData

```
function dailyData(uint256 day) external view returns (uint72 dayPayoutTotal, uint72 dayStakeSharesTotal, uint56 dayUnclaimedSatoshisTotal)
```

### dailyDataRange

```
function dailyDataRange(uint256 beginDay, uint256 endDay) external view returns (uint256[] list)
```

## IHEXStakeInstanceManager

### HSIStart

```
event HSIStart(uint256 timestamp, address hsiAddress, address staker)
```

### HSIEnd

```
event HSIEnd(uint256 timestamp, address hsiAddress, address staker)
```

### HSITransfer

```
event HSITransfer(uint256 timestamp, address hsiAddress, address oldStaker, address newStaker)
```

### HSITokenize

```
event HSITokenize(uint256 timestamp, uint256 hsiTokenId, address hsiAddress, address staker)
```

### HSIDetokenize

```
event HSIDetokenize(uint256 timestamp, uint256 hsiTokenId, address hsiAddress, address staker)
```

### hsiLists

```
function hsiLists(address generator, uint256 index) external view returns (address)
```

### hsiCount

```
function hsiCount(address originator) external view returns (uint256)
```

### hexStakeDetokenize

```
function hexStakeDetokenize(uint256 tokenId) external returns (address)
```

### hexStakeTokenize

```
function hexStakeTokenize(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### hexStakeEnd

```
function hexStakeEnd(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### hexStakeStart

```
function hexStakeStart(uint256 amount, uint256 length) external returns (address)
```

### hsiToken

```
function hsiToken(uint256 tokenId) external view returns (address)
```

### setApprovalForall

```
function setApprovalForall(address operator, bool approved) external
```

## IHedron

### Claim

```
event Claim(uint256 data, address claimant, uint40 stakeId)
```

### LoanEnd

```
event LoanEnd(uint256 data, address borrower, uint40 stakeId)
```

### LoanLiquidateBid

```
event LoanLiquidateBid(uint256 data, address bidder, uint40 stakeId, uint40 liquidationId)
```

### LoanLiquidateExit

```
event LoanLiquidateExit(uint256 data, address liquidator, uint40 stakeId, uint40 liquidationId)
```

### LoanLiquidateStart

```
event LoanLiquidateStart(uint256 data, address borrower, uint40 stakeId, uint40 liquidationId)
```

### LoanPayment

```
event LoanPayment(uint256 data, address borrower, uint40 stakeId)
```

### LoanStart

```
event LoanStart(uint256 data, address borrower, uint40 stakeId)
```

### Mint

```
event Mint(uint256 data, address minter, uint40 stakeId)
```

### hsim

```
function hsim() external view returns (address)
```

### mintInstanced

```
function mintInstanced(uint256 hsiIndex, address hsiAddress) external returns (uint256)
```

### mintNative

```
function mintNative(uint256 stakeIndex, uint40 stakeId) external returns (uint256)
```

## IPoolContract

### getEndStaker

```
function getEndStaker() external view returns (address end_staker_address)
```

## IPublicEndStakeable

### STAKE\_END\_DAY

```
function STAKE_END_DAY() external view returns (uint256)
```

### STAKE\_IS\_ACTIVE

```
function STAKE_IS_ACTIVE() external view returns (bool)
```

### mintHedron

```
function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external
```

### endStakeHEX

```
function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external
```

### getCurrentPeriod

```
function getCurrentPeriod() external view returns (uint256)
```

## IUnderlyingStakeable

this is the minimum interface needed to start and end stakes appropriately on hex

### StakeStore

```
struct StakeStore {
  uint40 stakeId;
  uint72 stakedHearts;
  uint72 stakeShares;
  uint16 lockedDay;
  uint16 stakedDays;
  uint16 unlockedDay;
  bool isAutoStake;
}
```

### stakeStart

```
function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external
```

starts a stake from the provided amount

_this method interface matches the original underlying token contract_

#### Parameters

<br/>

|Name           |Type   |Description                          |
|---------------|-------|-------------------------------------|
|newStakedHearts|uint256|amount of tokens to stake            |
|newStakedDays  |uint256|the number of days for this new stake|

<br/>

### stakeEnd

```
function stakeEnd(uint256 stakeIndex, uint40 stakeId) external
```

end your own stake which is custodied by the stake manager. skips tip computing this is not payable to match the underlying contract this moves funds back to the sender to make behavior match underlying token this method only checks that the sender owns the stake it does not care if it is managed in a created contract and externally endable by this contract (1) or requires that the staker send start and end methods (0)

#### Parameters

<br/>

|Name      |Type   |Description                                           |
|----------|-------|------------------------------------------------------|
|stakeIndex|uint256|the index on the underlying contract to end stake     |
|stakeId   |uint40 |the stake id from the underlying contract to end stake|

<br/>

### stakeGoodAccounting

```
function stakeGoodAccounting(address stakerAddr, uint256 stakeIndex, uint40 stakeIdParam) external
```

freeze the progression of a stake to avoid penalties and preserve payout

#### Parameters

<br/>

|Name        |Type   |Description                       |
|------------|-------|----------------------------------|
|stakerAddr  |address|the custoidan of the stake        |
|stakeIndex  |uint256|the index of the stake in question|
|stakeIdParam|uint40 |the id of the stake               |

<br/>

### stakeCount

```
function stakeCount(address staker) external view returns (uint256 count)
```

the count of stakes for a given custodian / staker

#### Parameters

<br/>

|Name  |Type   |Description              |
|------|-------|-------------------------|
|staker|address|the custodian in question|

<br/>

#### Return Values

<br/>

|Name |Type   |Description                                   |
|-----|-------|----------------------------------------------|
|count|uint256|of the stakes under a given custodian / staker|

<br/>

### globalInfo

```
function globalInfo() external view returns (uint256[13])
```

retrieve the global info from the target contract (hex) updated at the first start or end stake on any given day

### stakeLists

```
function stakeLists(address staker, uint256 index) external view returns (struct IUnderlyingStakeable.StakeStore)
```

retrieve a stake at a staker's index given a staker address and an index

#### Parameters

<br/>

|Name  |Type   |Description           |
|------|-------|----------------------|
|staker|address|the staker in question|
|index |uint256|the index to focus on |

<br/>

#### Return Values

<br/>

|Name |Type                                  |Description                                                 |
|-----|--------------------------------------|------------------------------------------------------------|
|\[0\]|struct IUnderlyingStakeable.StakeStore|stake the stake custodied by a given staker at a given index|

<br/>

### currentDay

```
function currentDay() external view returns (uint256)
```

retrieve the current day from the target contract

#### Return Values

<br/>

|Name |Type   |Description                                      |
|-----|-------|-------------------------------------------------|
|\[0\]|uint256|day the current day according to the hex contract|

<br/>

## GasReimberser

### POOL\_ADDRESS

```
address POOL_ADDRESS
```

### constructor

```
constructor(address poolAddress) public
```

### receive

```
receive() external payable
```

### flush

```
function flush() external
```

### flush\_erc20

```
function flush_erc20(address token_contract_address) external
```

## IMulticall3

### Call

```
struct Call {
  address target;
  bytes callData;
}
```

### Call3

```
struct Call3 {
  address target;
  bool allowFailure;
  bytes callData;
}
```

### Call3Value

```
struct Call3Value {
  address target;
  bool allowFailure;
  uint256 value;
  bytes callData;
}
```

### Result

```
struct Result {
  bool success;
  bytes returnData;
}
```

### aggregate

```
function aggregate(struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes[] returnData)
```

### aggregate3

```
function aggregate3(struct IMulticall3.Call3[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### aggregate3Value

```
function aggregate3Value(struct IMulticall3.Call3Value[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### blockAndAggregate

```
function blockAndAggregate(struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes32 blockHash, struct IMulticall3.Result[] returnData)
```

### getBasefee

```
function getBasefee() external view returns (uint256 basefee)
```

### getBlockHash

```
function getBlockHash(uint256 blockNumber) external view returns (bytes32 blockHash)
```

### getBlockNumber

```
function getBlockNumber() external view returns (uint256 blockNumber)
```

### getChainId

```
function getChainId() external view returns (uint256 chainid)
```

### getCurrentBlockCoinbase

```
function getCurrentBlockCoinbase() external view returns (address coinbase)
```

### getCurrentBlockDifficulty

```
function getCurrentBlockDifficulty() external view returns (uint256 difficulty)
```

### getCurrentBlockGasLimit

```
function getCurrentBlockGasLimit() external view returns (uint256 gaslimit)
```

### getCurrentBlockTimestamp

```
function getCurrentBlockTimestamp() external view returns (uint256 timestamp)
```

### getEthBalance

```
function getEthBalance(address addr) external view returns (uint256 balance)
```

### getLastBlockHash

```
function getLastBlockHash() external view returns (bytes32 blockHash)
```

### tryAggregate

```
function tryAggregate(bool requireSuccess, struct IMulticall3.Call[] calls) external payable returns (struct IMulticall3.Result[] returnData)
```

### tryBlockAndAggregate

```
function tryBlockAndAggregate(bool requireSuccess, struct IMulticall3.Call[] calls) external payable returns (uint256 blockNumber, bytes32 blockHash, struct IMulticall3.Result[] returnData)
```

## MockExternalPerpetualFilter

### \_isPerpetual

```
bool _isPerpetual
```

### setVerifyPerpetualResult

```
function setVerifyPerpetualResult(bool result) external
```

### verifyPerpetual

```
function verifyPerpetual(address) external view returns (bool)
```

## MockPerpetual

### startStakeHEX

```
function startStakeHEX() external
```

### STAKE\_END\_DAY

```
uint256 STAKE_END_DAY
```

### STAKE\_IS\_ACTIVE

```
bool STAKE_IS_ACTIVE
```

### currentPeriod

```
uint256 currentPeriod
```

### mintHedron

```
function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external
```

### endStakeHEX

```
function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external
```

### getCurrentPeriod

```
function getCurrentPeriod() external view returns (uint256)
```

<br/>

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBc3Rha2UtbWFuYWdlciUzQSUzQWhleHBheS1kYXk=/docs/g849fh5e).
