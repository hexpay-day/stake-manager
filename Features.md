# Features

This document outlines the features available in these contracts and how they might be utilized by other contracts or stakers.

### Contract Entry Points

- Isolated Stake Manager
- Consentual Stake Manager
- Grouped Stake Manager

### [IsolatedStakeManager.sol](./contracts/IsolatedStakeManager.sol)

This contract, or, more specifically it's factory, generates a contract based on the owner of the stake. Some features to understand about this contract:
* Anyone can create an Isolated Stake Manager (ISM) for any other address.
* Only the owner of the contract can start stakes.
* Addresses can be added as authorized end stakers.
* Tokens are transferred from the owner of the ISM contract to the ISM, where the stake starts.
* Ownership of the ISM can be transferred, even if stakes are active.
* Ownership is a 2 step process - [OZ's Ownable2Step](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable2Step).
* Start, end, and early end capabilities can be granted to any address and persist between each round of starting and ending stakes. For this reason it is best to only grant permission in 1 direction for each address.
* Early end stake capabilities can be removed, even for the owner by adjusting permissions.
* Can be ended by external, [multicall](https://github.com/mds1/multicall) contract
* Has permissioned multicall to do multiple actions at same time

### [HSIStakeManager.sol](./contracts/HSIStakeManager.sol)

This contract holds methods for managing hsi stakes.
* Anyone can deposit hsi's, that do not have hedron lent against them, must be paid off.
* HSI is detokenized and cannot come out so it is usually worth only depositing last minute / in remaining days before.
* Ability to call multiple end stakes available.
* Public multicall not available yet.
* Rewards can be minted for all owned hsi's at the same time. So, no more single tx for each mint.
* Send reward (hedron) or target (hex) tokens to any address.
* Send end stake calls from external multicall
* Mint hedron tokens as final step before ending stake
* Multiple end stakes owned by multiple addresses are possible to end at the same time.
* Transfers are reduced when end stake owners are grouped.

### [MaximusStakeManager.sol](./contracts/MaximusStakeManager.sol)

This contract generates intermediary, owned contracts to collect fees distributed by for maximus perpetuals ([base](https://etherscan.io/address/0xe9f84d418B008888A992Ff8c6D22389C2C3504e0), [trio](https://etherscan.io/address/0xF55cD1e399e1cc3D95303048897a680be3313308), [lucky](https://etherscan.io/address/0x6B0956258fF7bd7645aa35369B55B61b8e6d6140), [deci](https://etherscan.io/address/0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6), and [maxi](https://etherscan.io/address/0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b)).

* Generates an intermediary contract for collecting fees from perpetuals with ease using previously provided (though not released) interface.
* Only allows for current perpetuals to be ended - otherwise security vulnerability is opened up
* Create intermediary contract for any address
* Separate authorization levels for ending stakes, flushing tokens, withdrawing
* Permissioned multicall available for multiple flush and withdrawal steps

### [ConsentualStakeManager](./contracts/ConsentualStakeManager.sol)

This contract is a singleton that holds all stakes in a single contract for gas efficiency and chaining purposes.

* Settings for defining what to do with stakes when they are ended
* Auto send funds to owner or attribute in internal accounting
* Tip stake ender according to pre-defined functions
* Restart stake using multiple functions up to 254 times or infinitely
* Divide funds or pull percentage of interest off the top
* Consent signalling by signature (eip712)
* Automatic stake restarting - tokens never leave contract
* External [multicall](https://github.com/mds1/multicall) compatible
* Permissioned multicall available
* Preference for silent failures to reduce failure cases (gas loss)
* Removal of stake index requirement (internally tracked)
* Settings to require final hedron mint during stake end
* Anyone can mint hedron rewards to be custodied by ConsentualStakeManager
* Holds hedron rewards until owner collects them
* Low cost hedron mint authorization to allow for future skipping / upgrades to exclude from process

### [Settings](./contracts/ConsentualStakeManager.sol)

The settings struct holds all relevant settings for determining what tokens should go where when a stake is done as well as what the end stake call should do at the end of a stake.

The properties of the settings object are as follows:

| name | type | description |
|------|------|-------------|
| `tipMethod`             | `uint8`  | method to compute magnitude of tip to stake ender |
| `tipMagnitude`          | `uint64` | input to manipulate amount minted at end stake |
| `withdrawableMethod`    | `uint8`  | method to compute magnitude of hex, after tip, to send to staker |
| `withdrawableMagnitude` | `uint64` | input to manipulate amount transfered to staker at end stake |
| `newStakeMethod`        | `uint8`  | method to compute magnitude of hex to add to new stake* |
| `newStakeMagnitude`     | `uint64` | input to manipulate amount of hex to add to new stake after tip and transfer to owner |
| `newStakeDaysMethod`    | `uint8`  | method to compute the number of days the new stake should last |
| `newStakeDaysMagnitude` | `uint16` | input to compute number of days new stake should last |
| `consentAbilities`      | `uint8`  | set of binary permissions to signal which actions can be taken on the stake |
| `copyIterations`        | `uint8`  | a limiter on how many times the stake should be restarted** |

\* value below minimum signals no new stake should be created<br>
\** 0 = do not restart, 1-254 = countdown mechanism, 255 = always restart


### [#computeMagnitude](./contracts/ConsentualStakeManager.sol)

Compute magnitude is probably the most confusing method in the repo. Once broken down, it is fairly simple, but has a fair number of options which can make it confusing. Below is a breakdown of the options and features.

There are 4 inputs: `method`, `x`, `y`, and `stake`

The `method` arg determines which path (if statement) should be used. Each of these methods has its own implications for mutating the x and y values to result in another value.

The situations where this method is used includes the following:
* Compute ender tip
* Compute withdrawable magnitude (how much to send to staker)
* Compute new stake magnitude
* Compute new stake days

These situations can broadly be put into 2 categories: 1 manipulating inputs around an amount of hex to do something. Manipulating inputs around a number of days to do something.

##### Amount manipulation

The 3 main directions that determines what is done with the hex after the stake ends is as follows:
1. restart a stake
1. tip the ender
1. send to owner

Each of these manipulations uses method 0-6 in the compute magnitude methods as follows:

* `0` - returns zero
* `1` - returns the `y` value, i.e. the input of remaining hex
* `2` - returns the `x` value, i.e. the magnitude held in the the settings
* `3` - * returns a percentage of `y`, with `x`, the value on the settings struct as it's magnifier over `(2^64)-1`
* `4` - returns a percentage of the principle - using the `stakedHearts` property of the stake
* `5` - returns a percentage of the yield, i.e. `hexAmount - stakedHearts` to be used as `y`
* `6` - ** returns the `stakedDays` property, repeating the number of days, even if stake end occurs late
* `7` - ** returns a number of days to keep stake on a schedule, even if the end stake happens x days later than t-0 `today - lockedDay - 1 > stakedDays` then the staked days is repeated, otherwise correct for the number of delayed days.

\* ```settings.magnitude * remaining_amount / (2^64)-1```<br>
\** mostly useful for new stake days magnitude only<br>

Note: if the configuration is malformed for settings passed into the `computeMagnitude` method, it can cause unwanted results. For instance, because the `currentDay` is passed as the `y` value during stake days computing, it does not make sense to return the `y` value, as occurs in method `1` because that could result in the stake days being > `5555`.
