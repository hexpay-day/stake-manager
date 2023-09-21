# Features

This document outlines the features available in these contracts and how they might be utilized by other contracts or stakers.

### Contract Entry Points

- Isolated Stake Manager
- Singleton Stake Manager
- Existing Stake Manager

### [IsolatedStakeManager.sol](https://github.com/hexpay-day/stake-manager/master/contracts/IsolatedStakeManager.sol)

This contract, or, more specifically it's factory, generates a contract based on the owner of the stake. Some features to understand about this contract:

- Anyone can create an Isolated Stake Manager (ISM) for any other address.
- Only the owner of the contract can start stakes.
- Addresses can be added as authorized end stakers.
- Tokens are transferred from the owner of the ISM contract to the ISM, where the stake starts.
- Ownership of the ISM can be transferred, even if stakes are active.
- Ownership is a 2 step process - [OZ's Ownable2Step](https://docs.openzeppelin.com/contracts/4.x/api/access#Ownable2Step).
- Start, end, and early end capabilities can be granted to any address and persist between each round of starting and ending stakes. For this reason it is best to only grant permission in 1 direction for each address.
- Early end stake capabilities can be removed, even for the owner by adjusting permissions.
- Can be ended by external, [multicall](https://github.com/mds1/multicall) contract
- Has permissioned multicall to do multiple actions at same time

### [ExistingStakeManager.sol](https://github.com/hexpay-day/stake-manager/master/contracts/ExistingStakeManager.sol)

This contract holds methods for ending hsi and maximus stakes.

- Anyone can deposit hsi's, that do not have hedron lent against them (must be paid off).
- HSI is detokenized and can be withdrawn at any time.
- Ability to call multiple end stakes available.
- End stakes and mint hedron tokens in one transaction using a public multicall.
- Rewards can be minted for all owned hsi's at the same time. So, no more single tx for each mint.
- Send reward (hedron) or target (hex) tokens to any address.
- Send end stake calls from external multicall.
- Mint hedron tokens as final step before ending stake.
- Multiple end stakes owned by multiple addresses are possible to end at the same time.
- Transfers are reduced when end stake owners are grouped.
- Uses a whitelist to check maximus addresses: [base](https://etherscan.io/address/0xe9f84d418B008888A992Ff8c6D22389C2C3504e0), [trio](https://etherscan.io/address/0xF55cD1e399e1cc3D95303048897a680be3313308), [lucky](https://etherscan.io/address/0x6B0956258fF7bd7645aa35369B55B61b8e6d6140), [deci](https://etherscan.io/address/0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6), and [maxi](https://etherscan.io/address/0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b).
- Allows for the deployer to connect a contract in the future, to support other perpetual pools such as [hexpool.party](https://hexpool.party/)
- Generates an intermediary contract for collecting fees from perpetuals with ease using previously provided (though not released and therefore codified) interface.
- Only allows for current perpetuals to be ended - otherwise security vulnerability is opened up.
- Create intermediary contract for any address.
- Separate authorization levels for ending stakes, flushing tokens, withdrawing.
- Permissioned multicall available for multiple flush and withdrawal steps.
- End stakes available from external multicall for reach maximization.
- Leave tip to be collected by transaction runner in stake's hex, stake's hedron, or any other token.
- Tip amount for deposited tokens based on deposit with multiplier from block.basefee.

### [SingletonStakeManager](https://github.com/hexpay-day/stake-manager/master/contracts/SingletonStakeManager.sol)

This contract is a singleton that holds all stakes in a single contract for gas efficiency and chaining purposes.

- Settings for defining what to do with stakes when they are ended
- Auto send funds to owner or attribute in internal accounting
- Leave tip to be collected by transaction runner in stake's hex, stake's hedron, or any other token
- Tip amount for deposited tokens based on deposit with multiplier from block.basefee
- Restart stake using multiple functions up to 254 times or infinitely
- Divide funds or pull percentage of interest off the top
- Consent signalling by signature (eip712)
- Automatic stake restarting - tokens never leave contract
- External [multicall](https://github.com/mds1/multicall) compatible
- Permissioned multicall available
- Preference for silent failures to reduce failure cases (gas loss)
- Removal of stake index requirement (internally tracked)
- Settings to require final hedron mint during stake end
- Anyone can mint hedron rewards to be custodied by SingletonStakeManager
- Holds hedron rewards until owner collects them
- Low cost hedron mint authorization to allow for future skipping / upgrades to exclude from process
- Stake ownership can be transferred to different owners
- Stake tips can be replicated to new stakes when they are paid out
- Call GoodAccounting method for multiple stakes. Even mix the calls in with other end stakes to save gas money.

### [Settings](https://github.com/hexpay-day/stake-manager/master/contracts/EncodableSettings.sol)

The settings struct holds all relevant settings for determining what tokens should go where when a stake is done as well as what the end stake call should do at the end of a stake.

The properties of the settings object are as follows:

| name | type | description |
|------|------|-------------|
| `targetTip`             | `uint72` | holds an encoded linear value to determine the amount to tip in $HEX from the stake |
| `hedronTip`             | `uint72` | holds an encoded linear value to determine the amount to tip in $HEDRON from the stake |
| `newStake`              | `uint72` | holds an encoded linear value to determine the amount to start a new stake with |
| `newStakeDaysMethod`    | `uint8`  | method to compute the number of days the new stake should last |
| `newStakeDaysMagnitude` | `uint16` | input to compute number of days new stake should last |
| `copyIterations`        | `uint8`  | a limiter on how many times the stake should be restarted** |
| `consentAbilities`      | `uint8`  | set of binary permissions to signal which actions can be taken on the stake |

\* value below minimum signals no new stake should be created<br>
\** 0 = do not restart, 1-254 = countdown mechanism, 255 = always restart


### [#computeMagnitude](https://github.com/hexpay-day/stake-manager/master/contracts/Magnitude.sol)

Compute magnitude is probably the most confusing method in the repo. Once broken down, it is fairly simple, but has a fair number of options which can make it confusing. Below is a breakdown of the options and features.

There are 4 inputs: `method`, `x`, `y`, and `stake`

The `method` arg determines which path (if statement) should be used. Each of these methods has its own implications for mutating the x and y values to result in another value.

The situations where this method is used includes the following:
- Compute ender tip
- Compute withdrawable magnitude (how much to send to staker)
- Compute new stake magnitude
- Compute new stake days

These situations can broadly be put into 2 categories: 1 manipulating inputs around an amount of hex to do something. Manipulating inputs around a number of days to do something.

##### Amount manipulation

The main directions that determines what is done with the hex after the stake ends is as follows:
1. tip the ender
1. start a new stake
1. send to owner / custody funds (remainder)

The value of each of the following methods is able to be derived by using a magnitude method

1. tip the ender ($hedron)
1. tip the ender ($hex)
1. start a new stake
1. determine number of days to stake*

\* mostly useful for new stake days magnitude only<br>

Determining the number of days to start a stake uses a separate, pure function which is globally capped at `5_555`.

Each of the tip manipulations use a method of 0-2 to determine the value to use.

- `0` - returns zero always
- `1` - returns the full input amount
- `2` - returns a value held in the encoded setting

after 2, the values are determined by an (x/y)+b encoded in a 72 bit number.

- `3` - uses the total input value (principle + yield)
- `4` - uses the principle
- `5` - uses the yield

after 5, the numbers are repeated through 255, with each iteration, scaling the x value in the linear encoding by a factor of `2`.

### Auxilliary Features

The ability to create stakes that anyone has control over is an interesting feature that is not available in the current HEX staking model. The ability to create a stake for an address that does not yet exist or simply starting a stake for someone remotely is an exciting new feature that is now available to all hex stakers with these contracts. A simple model for how this could play out could be as follows:
1. Have the recipient create a wallet and send an address.
1. Start a stake for that address using the `stakeStartFromBalanceFor` method which will pull HEX from the sending wallet and mark the stake as owned by the designated recipient with settings that will roll the stake over, given some period.
1. Fund a small amount of eth to incent an end stake or provide appropriate settings to tip using hex.

Under this pattern, they have the stake length as the amount of time to figure out how to end their stake (use DeFi). And if they are unable to figure it out, their stake is still safe and can either be custodied by the contract or rolled into a ladder.

More complex patterns can be achived by launching contracts that utilize the `[StakeStarter](/api/StakeStarter/)` contract, such as creating NFT's (cheap) to delineate stake ownership without requiring a new contract be cloned (expensive), dead man switches, or social recovery mechanisms just to name a few.

Another reason why this library makes building on top of HEX much more attractive is that stake indexes no longer have to be tracked. The contract assumes, that there is no need to track an index in an array on top of an id since, generally one only cares about the stake id being ended. If a contract wishes to keep a list, they are still free to do so, but that list will be auxillary to the globally stored stake list under `[stakeIdInfo](/api/stakeIdInfo/)`.
