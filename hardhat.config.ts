import { task, type HardhatUserConfig } from "hardhat/config";
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
import 'hardhat-vizor'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'
import 'hardhat-slither'
import * as ethers from "ethers";

import * as conf from './src/config'

import { main as impersonateAndFund } from './tasks/impersonate-and-fund'

task('impersonate-and-fund', 'impersonate an address and fund another address with a provided amount of hex')
  .addOptionalParam('impersonate', 'the address to impersonate', '0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')
  .addOptionalParam('amount', 'the amount to send to the provided address', '0')
  .addOptionalParam('decimal', 'the amount in decimal form to send to the provided address', '0')
  .addOptionalParam('to', 'where to send the funds', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  .setAction(impersonateAndFund)

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
  gasPrice: 'auto',
  chains: {
    369: {
      hardforkHistory: {
        merge: 17_233_001,
        shanghai: 17_233_001,
      },
    },
  },
}

const ethereum: HardhatNetworkUserConfig = {
  forking: {
    url: 'https://eth.llamarpc.com',
    blockNumber: conf.args.blockNumber,
  },
}

const hardhatNetworks: Record<string, HardhatNetworkUserConfig> = {
  pulsechainV4,
  pulsechain,
  ethereum,
  local: ethereum,
}

const defaultNetwork = {
  timeout: 100_000_000,
  accounts: {
    mnemonic: 'test test test test test test test test test test test junk',
  },
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
  local: {
    ...defaultNetwork,
    url: ethereum.forking?.url,
    ...ethereum,
  },
}
const settings = {
  optimizer: {
    enabled: true,
    runs: 200,
  },
}

const explorerApiKey = 'abc'

let hexArtifact = {} as unknown as Artifact;
try {
  const hexArtifactPath = path.join(__dirname, 'artifacts', 'contracts', 'reference', 'Hex.sol', 'HEX.json')
  const hexArtifactBuffer = fs.readFileSync(hexArtifactPath)
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
  etherscan: {
    apiKey: {
      'external': explorerApiKey,
    },
    customChains: [{
      network: 'external',
      chainId: 1,
      urls: {
        apiURL: 'https://etherscan.io/api',
        browserURL: 'https://etherscan.io/',
      },
    }, {
      network: 'external',
      chainId: 369,
      urls: {
        apiURL: 'https://scan.pulsechain.com/api',
        browserURL: 'https://scan.pulsechain.com/',
      },
    }, {
      network: 'external',
      chainId: 943,
      urls: {
        apiURL: 'https://scan.v4.testnet.pulsechain.com/api',
        browserURL: 'https://scan.v4.testnet.pulsechain.com/',
      },
    }],
  },
};

export default config;
