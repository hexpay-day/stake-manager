import { task, type HardhatUserConfig } from "hardhat/config";
import type {
  Artifact,
  HardhatNetworkHDAccountsUserConfig,
  HardhatNetworkUserConfig,
  NetworkUserConfig,
  SolcUserConfig,
} from "hardhat/types";
import * as fs from 'fs'
import * as path from 'path'
import "@nomicfoundation/hardhat-toolbox";
import '@nomicfoundation/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-network-helpers'
import '@nomicfoundation/hardhat-verify'
import "hardhat-preprocessor"
import 'hardhat-tracer'
import 'solidity-coverage'
import 'hardhat-vizor'
import 'hardhat-gas-reporter'
import 'hardhat-dependency-compiler'
import 'solidity-docgen'
import '@typechain/hardhat'
import 'ethers'
import * as ethers from "ethers";

import * as conf from './src/config'

import { main as deploy } from './tasks/deploy'
import { main as deployExistingStakeManager } from './tasks/deploy/existing-stake-manager'
import { main as deployStakeManager } from './tasks/deploy/stake-manager'
import { main as deployIsolatedStakeManagerFactory } from './tasks/deploy/isolated-stake-manager-factory'
import { main as impersonateAndFund } from './tasks/impersonate-and-fund'
import { main as timeWarp } from './tasks/time-warp'
import { main as depositHsi } from './tasks/write/hsi/deposit'
import { main as countHsi } from './tasks/read/hsi/count'
import { main as endBundleBase } from './tasks/write/existing/end-bundle/base'
import _ from "lodash";

task('impersonate-and-fund', 'impersonate an address and fund another address with a provided amount of hex')
  // address is valid on pulsechain v4 + ethereum
  // pulsechain is: 0x5280aa3cF5D6246B8a17dFA3D75Db26617B73937
  .addOptionalParam('impersonate', 'the address to impersonate')
  .addOptionalParam('amount', 'the amount to send to the provided address', '0')
  .addOptionalParam('decimal', 'the amount in decimal form to send to the provided address', '0')
  // hexpay.day deployer
  .addOptionalParam('to', 'where to send the funds', '0x73CaB6c9EDA8aBc28099aF9F5dBd100Aa998Ae72')
  .addOptionalParam('token', 'the token to send', '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39')
  .setAction(impersonateAndFund)

task('deploy', 'deploys all contracts')
  .addOptionalParam('stopAt', 'the contract to stop at', 'none')
  .setAction(deploy)

task('deploy:existing-stake-manager', 'deploys existing stake manager contract')
  .setAction(deployExistingStakeManager)

task('deploy:stake-manager', 'deploys stake manager contract')
  .setAction(deployStakeManager)

task('deploy:isolated-stake-manager-factory', 'deploys stake manager contract')
  .setAction(deployIsolatedStakeManagerFactory)

task('time-warp', 'increases the timestamp of the chain by a magnitude and unit')
  .addPositionalParam('magnitude', 'the size of the jump', '1')
  .addPositionalParam('unit', 'the unit of the time jump', 'days')
  .setAction(timeWarp)

task('write:hsi:deposit', 'deposit hsis into an existing stake manager')
  .addFlag('approveIndividual', 'prefer to use approve all instead of individual approvals')
  .setAction(depositHsi)

task('read:hsi:count', 'read hsi token counts')
  .setAction(countHsi)

task('write:existing:end-bundle:base', 'end the bundle of hsi + base')
  .addFlag('mev', 'use the mev pathway to send transaction')
  .addFlag('sim', 'simulate the transaction')
  .addFlag('wait', 'wait until the block gets closer to the desired timestamp')
  .setAction(endBundleBase)

function getRemappings() {
  return fs
    .readFileSync("remappings.txt", "utf8")
    .split("\n")
    .filter(Boolean) // remove empty lines
    .map((line) => line.trim().split("="));
}

const defaultNetwork = {
  accounts: {
    mnemonic: conf.args.mnemonic,
    count: 5,
  },
}

const defaultHardhatNetwork: HardhatNetworkUserConfig = {
  allowBlocksWithSameTimestamp: true,
  accounts: {
    accountsBalance: ethers.parseEther((100_000_000_000).toString()).toString(),
    count: 5,
    mnemonic: conf.args.mnemonic,
  } as HardhatNetworkHDAccountsUserConfig,
  mining: {
    auto: true,
    interval: 10_000,
  },
}

const pulsechainV4: HardhatNetworkUserConfig = {
  forking: {
    url: conf.args.rpc943,
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
    url: conf.args.rpc369,
    blockNumber: conf.args.blockNumber,
  },
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
    url: conf.args.rpc1,
    blockNumber: conf.args.blockNumber,
  },
  // chains is known by hh
}

const hardhatNetworks: Record<string, HardhatNetworkUserConfig> = {
  pulsechainV4: {
    ...defaultHardhatNetwork,
    ...pulsechainV4,
  },
  pulsechain: {
    ...defaultHardhatNetwork,
    ...pulsechain,
  },
  ethereum: {
    ...defaultHardhatNetwork,
    ...ethereum,
  },
  local: {
    ...defaultHardhatNetwork,
    ...ethereum,
  },
  localhost: {
    ...defaultHardhatNetwork,
    ...ethereum,
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
  localhost: {
    ...defaultNetwork,
    url: 'http://127.0.0.1:8545/',
    ...ethereum,
  },
}
const settings: SolcUserConfig["settings"] = {
  optimizer: {
    enabled: true,
    runs: 200,
    // details: {
    //   yul: true,
    //   yulDetails: {
    //     stackAllocation: true,
    //     optimizerSteps: 'dhfoDgvulfnTUtnIf',
    //   },
    // },
  },
}

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
      version: "0.8.9",
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
    target: 'ethers-v6',
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
      address: ethers.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39'),
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
      'external': conf.args.apiKey,
    },
    customChains: [{
      network: 'external',
      chainId: 1,
      urls: {
        apiURL: 'https://api.etherscan.io/api',
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
  mocha: {
    timeout: 100_000_000,
  },
  docgen: {
    exclude: ['reference', 'test'],
    pages: 'files',
    templates: 'docgen-templates',
    outputDir: 'docs/api',
  },
};

export default config;
