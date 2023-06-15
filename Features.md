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
* Has permissioned multicall which preserves `msg.sender`

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
* Only allows for current perpetuals to be ended - otherwise security vulnerability is opened up.
* Create intermediary contract for any address.
* Separate authorization levels for ending stakes, flushing tokens, withdrawing.
