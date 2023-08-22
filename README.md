# Stake Manager

build the contracts
```bash
yarn run build
```

note: sometimes tests fail if your network connection is a little slow at the time and are running for the first time after a fresh install or deleting the cache

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

### Auditors

The contracts that need to be reviewed are in the `contracts` folder and excludes the `references` and `interfaces` folders. The contracts folder is ~2400 sloc. The reference contract (HEX) is ~1640 SLOC, but has been modified from the original source so should mostly be used as a logical reference, not a byte for byte copy reference. [Original can be found on etherscan.](https://etherscan.io/token/0x2b591e99afe9f32eaa6214f7b7629768c40eeb39#code) The [HEDRON](https://etherscan.io/token/0x3819f64f282bf135d62168c1e513280daf905e06#code) and [HSIM](https://etherscan.io/token/0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3#code) contracts are also available on etherscan.

### Purpose

_Why do these contracts exist? Hex works fine._

Does it though? If you look at a trace of a hex end stake on either Ethereum or PulseChain you will find a series of sloads, each costing 2100 gas to perform, for each and every day that the stake was active. This has been a known issue in the Hex community by any dev who has reviewed the contract. It even showed up in the [audit](https://hex.com/docs/HEX-Security-Audit-by-CoinFabrik-DEC2019.pdf) (search "excessive gas") and the maximum days were adjusted to accomodate for this issue. Note, the audit shows gas prices before they were adjusted upward in the berlin hardfork ([eip-2929](https://eips.ethereum.org/EIPS/eip-2929)).

Luckily, there is a path forward. I do not care if you end up using these contracts, I just want hexicans to be able to save their gas money and not waste it because they were unable to coordinate to get out of this predicament. I do think that if everyone uses the same contract to end their stake that there are huge gains in the order of 90% savings that can be achieved.

_Example of the beginning of a loop of SLOAD opcodes in a hex end stake trace:_
```
[CALL] HEX.stakeEnd{gasLimit: 27352339, gasUsed: 97795}(stakeIndex: 0, stakeId: 753528)
    ...
    [SLOAD]  0xdda06d28b5606a2fe53c7f6a483f39015a82a9bfd0de5e96eeb6c58000ba81ee → 0x000000000000000658f34ca497f40089afa87a44d8e3eb000016fa69dcb20aeb
    [SLOAD]  0xa06aadea4af292bd92ab3bf43d1cff881c17fbc11823e091052e6f28183b54f4 → 0x000000000000000658f34ca497f40089afa87a46fa9e6e000016fa69dcb20aeb
    [SLOAD]  0x190b667e52f43d2702b8b140846254d4c605c538cac4ffbf71bfc15a52e918ed → 0x000000000000000658f34ca497f40089afa87a491c58f1000016fa69dcb20aeb
    [SLOAD]  0xbf2ed40e61263ec15fa26d6cd7fd7ca6eab02cf0c5b8d472b984358ce766cd2d → 0x000000000000000658f34ca497f40089afa87a4b3e1374000016fa69dcb20aeb
    [SLOAD]  0x2b09031e28a4e057528dd5f905fd7e693380259968dae7dd73dbff908f24309b → 0x000000000000000658f34ca497f40089afa87a4d5fcdf7000016fa69dcb20aeb
    [SLOAD]  0x288acb679d443f9827db46dcce7a64ca218532a28082f54cc182748e8738d4da → 0x000000000000000658f34ca497f40089afa87a4f81887a000016fa69dcb20aeb
    [SLOAD]  0xbe9456aed8839ac7f86c2676ebbfe07f14df3dbf90380b8eb2207559e49efc6b → 0x000000000000000658f34ca497f40089afa87a51a342fd000016fa69dcb20aeb
    [SLOAD]  0xc0e3d1106762ec326034dbc738125d32396159576544d62e2cec49d21cbb76cc → 0x000000000000000658f34ca497f40089afa87a53c4fd80000016fa69dcb20aeb
    ...
    (continues for each day that this stake was active)
```

What is worse is that these cost are project to increase only. The underlying cause is a merkle root that needs to be computed, which is highly compute and io (between node and it's db) intensive.

_Ok, let's assume that this is a good idea. Who will consent to use it?_

Isn't that the beauty of blockchains? Meritocracy as a mix of knowledge, actionable pathways, and consent. The question is a good one and is still a big unknown. The best answer I have for now is that someone will have to market this pathway as a better, both UX-wise and economically, way to end stakes, in some capacity. Currently the means of achieving this is reaching out to devs and asking for input / help supporting their protocol.

I think we can get a lot of people on our side on this one. All grouped stakes, for example, have both a tragedy of the commons problem as well as the very real, very costly problem of ending a stake. There are vaious ways to work around this problem: Maximus, for example has opted for public end staking, which is advantageous for a repo like this because those publicly endable stakes could be ended at the same time as any stake in these contracts. Which allows us to save when ending those those existing stakes, or any other contract based stake, until devs can figure out how to migrate to using these contracts between their contracts and hex itself, if at all.

I would recommend that people use grouped stake contracts like the ones mentioned already, the solution, however, is to update contracts so that end stakes are maximally efficient and run grouping pools on top of a more efficient sub structure.

_Speaking of that, will all projects need to redeploy and devote resources to upgrading?_

Unless they have an upgradable contract, which I have not seen used, yes, projects like Hedron, Maximus, or 0xStakehouse would indeed need to redeploy contracts. However, because most of the relevant hex interface can be replicated in this repo, the implementation can be very straightforward, requiring minimal changes, if any.

There may also be gains that can be made by using the access list parameter in transactions (~1/21%), however, the async nature of transaction mining makes this route a bit risky, since all of the gas is paid up front. This means that even if the transaction were to fail the full storage would have already been accessed, causing huge costs with zero gain. There is a way to include this optimization, however, it has to do more with deciding _when_ to use it since it essentially requires that the storage slots be used, otherwise, the gas is wasted. I believe this is best utilized at the front end / interface level when one can guarantee, short of the private key being used elsewhere, that the stake will be ended with that transaction.

Technical Resources:
* [article from hardhat dev](https://hackmd.io/@fvictorio/gas-costs-after-berlin) on updates
* [high level mechanical walk through](https://www.youtube.com/watch?v=qQpvkxKso2E) of eip2929 and 2930
* [eip 2929](https://eips.ethereum.org/EIPS/eip-2929)
* [eip 2930](https://eips.ethereum.org/EIPS/eip-2930)

_Ok, but there must be limits to this solution._

There are. One prominant limitation is that gas costs won't make a difference if the base gas fee is still too high to fit within a single transaction. At the current limit of 1 ether transaction fee limit, the base fee must be less than 85gwei. This is a reasonable expectation within, say, a month timeframe for now and will be more relevant to more people if the price of native currencies increases, but both of those points could change in the future.

_What does success look like?_

In contract terms, success would be the majority of stakes started after these contracts are launched are ended through these contracts.

Economically, success would be, at a minimum, reducing the cost of ending a stake, or even more broadly, managing a stake / principle by a fraction, at least 50%, however, I think these savings are achievable, especially for short-medium to medium-long stakes. This, value, expressed in terms of dollars could be highly valuable by itself. However, what is better is that this value compounds over time and allows hexicans to have more dollars to spend on other (non gas) things.

Here are some graphs and data relevant to the issue.
* https://dune.com/queries/2633637/4373958
* https://dune.com/queries/2633639
* https://dune.com/hexpay_day/end-stake-costs

Note: it appears that someone did do shared end stakes at some point (5 total transactions over the course of 3 years). It seems that they stopped for some reason. Perhaps they did not understand what they were doing or shut down for other reasons and did not realize the value of what they had.

For this product / library / idea to be successful, it only needs to serve legitimate end stakes and reduce the cost of ending stakes when compared to ending those stakes alone. It would be amazing if all new stakes were to be created through this system, however, anyone who is able to use this to increase their shares and reduce their stake cost is a win in my book. A measurement of success could be to compare transactions ended through this system vs txs as they would have ended through other systems.

There are multiple rational, but also detrimental behaviors that occur without a library like this.
1. simply wait until a stake has ended to start a new stake with your newly aquired tokens
1. wait multiple days to end a stake since hex has 14 days before penalty is accrued from late ends during periods of high base fee

Sitting in liquid hex does provide benefits, certainly. However, some people prefer sitting in tshares to not have to think about their position and this library helps reduce the psychological cost of requiring one to add liquid hex after ending stakes.

_Doesn't the Good Accounting method fix this?_

No, in fact, it makes it worse, unless you get the cached SLOAD cost. If you look at the underlying code for the good accounting method, you'll find that in order to good account, you have to do all of the calculations that the stake end method does, but the stake end method doesn't even get to take advantage of doing the calculation there and it costs the same as ending a stake. Using a public multicall, however, using a contract like this, you can good account multiple stakes at the same time, therefore saving gas funds and saving any bleeding stakes.
