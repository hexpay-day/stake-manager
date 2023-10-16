# Stake Manager

[![Tests](https://github.com/hexpay-day/stake-manager/actions/workflows/test.yml/badge.svg)](https://github.com/hexpay-day/stake-manager/actions/workflows/test.yml)
[![Coverage Status](https://coveralls.io/repos/github/hexpay-day/stake-manager/badge.svg?branch=master)](https://coveralls.io/github/hexpay-day/stake-manager?branch=master)

build the contracts
```bash
yarn run build
```

***NOTE: sometimes tests fail if your network connection is a little slow at the time and are running for the first time after a fresh install or deleting the cache***

run tests
```bash
yarn run foundry:test
yarn run test
yarn run test --trace-error # with error traces
```

### Verification

verification should occur with git hash `f1180beb5322796abeaa5fd2371afb3f6a880d62` to have the correct bytecode

### Run Traces

```bash
npx hardhat trace --hash 0xdeadbeef... # tx hash
```

### Local Development

to run a node locally, simply run
```bash
npx hardhat node
```

then, in another terminal, you can run the `local-development` script to fund your deploy mnemonic (env: `DEPLOY_MNEMONIC`)
```bash
./local-development
```

in the case of the hexpay.day developers, they may wish to provide the following series of envs and run the local development script as noted above in order to test in a browser
```bash
# where stakes will be ended / managed from
TEST_ADDRESS=0xE971e07BF9917e91DFbeD9165f2ea8e6FF876880
# where contracts will be deployed from
# must be first address of `DEPLOY_MNEMONIC`
DEPLOY_ADDRESS=0x73CaB6c9EDA8aBc28099aF9F5dBd100Aa998Ae72
```

### Auditors

The contracts that need to be reviewed are in the `contracts` folder and excludes the `references` and `interfaces` folders. The contracts folder is ~2400 sloc. The reference contract ([HEX.sol](https://etherscan.io/token/0x2b591e99afe9f32eaa6214f7b7629768c40eeb39#code)) is ~1640 SLOC, but has been modified from the original source so can only be used as a logical reference, not a byte for byte copy reference. Original can be found on etherscan. The [HEDRON](https://etherscan.io/token/0x3819f64f282bf135d62168c1e513280daf905e06#code) and [HSIM](https://etherscan.io/token/0x8bd3d1472a656e312e94fb1bbdd599b8c51d18e3#code) contracts are also available on etherscan and are ~2700 sloc combined.

NOTE: the contracts in this repo do not care about any tokens except for the ones listed above and the [maximus perpetuals](https://github.com/hexpay-day/stake-manager/master/contracts/MaximusStakeManager.sol#L30-L34) (custodial contract for a hex stake). That being said, it would be great if you familiarized yourself with the quirks of these 3 token contracts as they do break common practices.

Metrics for the repo can be generated by running `yarn run metrics`.

```bash
# ethereum
npx hardhat --network external write:existing:end-bundle:base --wait --mev
# if the above command fails, then run
npx hardhat --network external write:existing:end-bundle:base --wait

# pulsechain
npx hardhat --network external write:existing:end-bundle:base --wait
```
