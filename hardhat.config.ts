import type { HardhatUserConfig } from "hardhat/config";
import type {
  Artifact,
  HardhatNetworkUserConfig,
  NetworkUserConfig,
} from "hardhat/types";
import * as fs from 'fs'
import * as path from 'path'
import "@nomicfoundation/hardhat-toolbox";
import 'hardhat-tracer'
import 'hardhat-gas-trackooor'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'
import * as ethers from "ethers";

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

let hexArtifact = {} as unknown as Artifact;
try {
  const hexArtifactBuffer = fs.readFileSync(path.join(__dirname, 'artifacts', 'contracts', 'reference', 'Hex.sol', 'HEX.json'))
  hexArtifact = JSON.parse(hexArtifactBuffer.toString())
} catch (err) {}

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
    showMethodSig: true,
    remoteContracts: [{
      abi: hexArtifact.abi,
      name: 'HEX',
      address: ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'),
      bytecode: hexArtifact.bytecode,
    }],
  },
  dependencyCompiler: {
    paths: [
      '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol',
    ],
  },
  tracer: ((enabled) => ({
    showAddresses: enabled,
    defaultVerbosity: enabled ? 4 : 0,
    enableAllOpcodes: enabled,
    gasCost: enabled,
    enabled,
  }))(false),
};

export default config;
