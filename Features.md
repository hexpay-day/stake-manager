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
