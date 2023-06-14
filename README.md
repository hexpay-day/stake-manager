# Stake Manager

build the contracts
```bash
yarn run buid
```

run tests
```bash
yarn run foundry:test
yarn run test
yarn run test --trace-error # with error traces
```

### Run Traces

```bash
npx hardhat trace --hash 0xdeadbeef... # tx hash
```

### Purpose

_Why do these contracts exist? Hex works fine._

Does it though? If you look at a trace of a hex end stake on either Ethereum or PulseChain you will find a series of sloads, each costing 2100 gas to perform, for each and every day that the stake was active. This has been a known issue in the Hex community by any dev who has reviewed the contract. It even showed up in the [audit](https://hex.com/docs/HEX-Security-Audit-by-CoinFabrik-DEC2019.pdf) (search "excessive gas") and the maximum days were adjusted to accomodate for this issue. Note, the audit shows gas prices before they were adjusted upward in the berlin hardfork ([eip-2929](https://eips.ethereum.org/EIPS/eip-2929)).

Luckily, there is a path forward. I do not care if you end up using these contracts, I just want hexicans to be able to save their gas money and not waste it because they were unable to coordinate to get out of this predicament. I do think that if everyone uses the same contract to end their stake that there are huge gains in the order of 95% or more savings that can be achieved.

_Example of the beginning of a loop of SLOAD opcodes in a hex end stake trace:_
```
[CALL] HEX.stakeEnd{gasLimit: 27352339, gasUsed: 97795}(stakeIndex: 0, stakeId: 753528)
    [SLOAD]  0x3 → 0x45a070000003c667d6f21e8005a1dbb692fb4b57e
    [SLOAD]  0x4 → 0x1dff00bacc6db6fa3658f34ca497f400000b8038008e7f6e9d4920f1c405c2
    [SLOAD]  0xc0c290fd225d346740f6f0d945f6e1413dd0ee2026195ef7d5cfd64a0fbcbe8c → 0x6
    [SLOAD]  0xc0c290fd225d346740f6f0d945f6e1413dd0ee2026195ef7d5cfd64a0fbcbe8c → 0x6
    [SLOAD]  0xc0c290fd225d346740f6f0d945f6e1413dd0ee2026195ef7d5cfd64a0fbcbe8c → 0x6
    [SLOAD]  0x5b0f1e012074b5c8964cc65ac50a81628329a265217c1184cae6e82b5436f254 → 0xb8050a000000125f2cab5e690000002d79883d200000000b7f78
    [SLOAD]  0x5b0f1e012074b5c8964cc65ac50a81628329a265217c1184cae6e82b5436f254 → 0xb8050a000000125f2cab5e690000002d79883d200000000b7f78
    [SLOAD]  0x361ef38d1a348af1ede885af370a74a1d30ef247a2cbf8eb0161b315df38da7e → 0x658f34ca497f4008e7f935a0ffe58e6000016db519154880d
    ...
    (continues for each day that this stake was active)
```

_What does success look like?_

In contract terms, success would be the majority of stakes started after these contracts are launched are ended through these contracts.

Economically, success would be, at a minimum, reducing the cost of ending a stake, or even more broadly, managing a stake / principle by a fraction, at least 50%, however, I think 95% is certainly achievable, especially for medium to medium-long stakes. This, value, expressed in terms of dollars could be highly valuable by itself. However, what is better is that this value compounds over time and allows hexicans to have more dollars to spend on other (non gas) things.

Here are some graphs and data relevant to the issue.
* https://dune.com/queries/2633637/4373958
* https://dune.com/queries/2633639

Note: it appears that someone did do shared end stakes at some point (5 total transactions over the course of 3 years). It seems that they stopped for some reason. Perhaps they did not understand what they were doing or shut down for other reasons and did not realize the value of what they had.

_Ok, let's assume that this is a good idea. Who will consent to use it?_

Isn't that the beauty of blockchains? Meritocracy as a mix of knowledge, actionable pathways, and consent. The question is a good one and is still a big unknown. The best answer I have for now is that someone will have to market this pathway as a better, both UX-wise and economically, way to end stakes, in some capacity. Currently the means of achieving this is reaching out to devs and asking for input / help supporting their protocol.

I think we can get a lot of people on our side on this one. All grouped stakes, for example, have both a tragedy of the commons problem as well as the very real, very costly problem of ending a stake. There are vaious ways to work around this problem: Maximus, for example has opted for public end staking, which is advantageous for a repo like this because those publicly endable stakes could be ended at the same time as any stake in these contracts. Which allows us to save when ending those those existing stakes, or any other contract based stake, until devs can figure out how to migrate to using these contracts between their contracts and hex itself, if at all.

I would recommend that people use grouped stake contracts like the ones mentioned already, the solution, however, is to update contracts so that end stakes are maximally efficient and run grouping pools on top of a more efficient sub structure.

_Speaking of that, will all projects need to redeploy and devote resources to upgrading?_

Unless they have an upgradable contract, which I have not seen used, yes, projects like Hedron, Maximus, or 0xStakehouse would indeed need to redeploy contracts. However, because most of the relevant hex interface can be replicated in this repo, the implementation can be very straightforward, requiring minimal changes, if any.

_Ok, but there must be limits to this solution._

There are. One prominant one is that gas costs won't make a difference if the base gas fee is still too high to fit within a single transaction. At the current limit of 1 ether transaction fee limit, the base fee must be less than 85gwei. This is a reasonable expectation for now and will be more relevant to more people if the price of native currencies increases, but both of those points could change in the future.
