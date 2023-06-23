import type { HardhatUserConfig } from "hardhat/config";
import type {
  Artifact,
  HardhatNetworkUserConfig,
  NetworkUserConfig,
} from "hardhat/types";
import * as fs from 'fs'
import * as path from 'path'
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-preprocessor"
import 'hardhat-tracer'
import 'solidity-coverage'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'
import * as ethers from "ethers";

import * as conf from './src/config'

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="));
}

const pulsechainV4: HardhatNetworkUserConfig = {
  forking: {
    url: 'https://rpc.v4.testnet.pulsechain.com',
    blockNumber: conf.args.blockNumber,
  },
  chains: {
    943: {
      hardforkHistory: {
        merge: 15_537_394,
        shanghai: 15_537_395,
      },
    },
  },
}

const pulsechain: HardhatNetworkUserConfig = {
  forking: {
    url: 'https://rpc.pulsechain.com',
    blockNumber: conf.args.blockNumber,
  },
  chains: {
    369: {
      hardforkHistory: {
        merge: 17_233_001,
        shanghai: 17_233_001,
        grayGlacier: 15_050_000,
        arrowGlacier: 13_773_000,
        london: 12_965_000,
        berlin: 12_244_000,
        miurGlacier: 9_200_000,
      },
    },
  },
}

const ethereum: HardhatNetworkUserConfig = {
  forking: {
    url: 'https://rpc.ankr.com/eth',
    blockNumber: conf.args.blockNumber,
  },
}

const hardhatNetworks: Record<string, HardhatNetworkUserConfig> = {
  pulsechainV4,
  pulsechain,
  ethereum,
}

const defaultNetwork = {
  timeout: 100_000_000,
}

const networks: Record<string, NetworkUserConfig> = {
  ethereum: {
    ...defaultNetwork,
    url: ethereum.forking?.url,
    ...ethereum,
  },
  pulsechainV4: {
    ...defaultNetwork,
    url: pulsechainV4.forking?.url,
    ...pulsechainV4,
  },
  pulsechain: {
    ...defaultNetwork,
    url: pulsechain.forking?.url,
    ...pulsechain,
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
    hardhat: hardhatNetworks[conf.args.chain],
    external: networks[conf.args.chain],
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
    // showMethodSig: true,
    remoteContracts: [{
      abi: hexArtifact.abi,
      name: 'HEX',
      address: ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'),
      bytecode: hexArtifact.bytecode,
    }],
  },
  dependencyCompiler: {
    paths: [
      // '@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol',
    ],
  },
  preprocess: {
    eachLine: () => ({
      transform: (line: string) => {
        if (line.match(/^\s*import /i)) {
          for (const [from, to] of getRemappings()) {
            if (line.includes(from)) {
              const l = line
              line = line.replace(from, to);
              console.log(l, '->', line);
              break;
            }
          }
        }
        return line;
      },
    }),
  },
  paths: {
    artifacts: './artifacts',
    sources: "./contracts",
    cache: "./cache_hardhat",
  },
  tracer: ((enabled) => ({
    opcodes: conf.args.tracerOpcodes.length ? conf.args.tracerOpcodes as string[] : undefined,
    showAddresses: false,
    defaultVerbosity: conf.args.tracerVerbosity,
    enableAllOpcodes: enabled,
    gasCost: enabled,
    enabled,
  }))(false),
};

export default config;
