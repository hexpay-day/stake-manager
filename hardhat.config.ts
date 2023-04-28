import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { HardhatNetworkUserConfig, NetworkUserConfig } from "hardhat/types";
import 'hardhat-tracer'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'

import * as conf from './src/config'

const pulsechainV4: HardhatNetworkUserConfig = {
  forking: {
    url: 'https://rpc.v4.testnet.pulsechain.com',
  },
  chains: {
    943: {
      hardforkHistory: {
        merge: 15_537_394,
        shanghai: 99_000_000,
      }
    },
  },
}

const hardhatNetworks: Record<string, HardhatNetworkUserConfig> = {
  pulsechainV4,
}

const defaultNetwork = {
  timeout: 100_000_000,
}

const networks: Record<string, NetworkUserConfig> = {
  pulsechainV4: {
    ...defaultNetwork,
    url: pulsechainV4.forking?.url,
    ...pulsechainV4,
  },
}
const settings = {
  optimizer: {
    enabled: true,
    runs: 100_000,
  },
}

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{
      version: "0.8.18",
      settings,
    }, {
      version: '0.5.13',
      settings,
    }],
  },
  networks: {
    hardhat: hardhatNetworks[conf.args.network],
    external: networks[conf.args.network],
  },
  typechain: {
    target: 'ethers-v5',
    outDir: 'artifacts/types',
  },
  gasReporter: {
    currency: 'USD',
    token: 'ETH',
    enabled: true,
    gasPrice: 100,
    coinmarketcap: conf.args.coinmarketcap,
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol',
    ],
  },
  tracer: ((enabled) => ({
    showAddresses: !enabled,
    defaultVerbosity: enabled ? 4 : 0,
    enableAllOpcodes: !enabled,
    gasCost: !enabled,
    enabled,
  }))(false),
};

export default config;
