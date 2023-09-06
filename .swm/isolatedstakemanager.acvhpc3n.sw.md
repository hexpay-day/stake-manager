---
id: acvhpc3n
title: IsolatedStakeManager
file_version: 1.1.3
app_version: 1.16.4
---

# Solidity API

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

This file was generated by Swimm. [Click here to view it in the app](https://app.swimm.io/repos/Z2l0aHViJTNBJTNBc3Rha2UtbWFuYWdlciUzQSUzQWhleHBheS1kYXk=/docs/acvhpc3n).
