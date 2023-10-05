import dotenv from 'dotenv'
dotenv.config()
import { ethers } from 'ethers'
import * as yargs from 'yargs'
import { ERC20 } from '../artifacts/types'

Error.stackTraceLimit = Infinity

export const args = yargs.options({
  rpc1: {
    type: 'string',
    required: false,
    describe: 'the rpc ur for chain id 1',
    default: 'https://eth.llamarpc.com',
  },
  rpc369: {
    type: 'string',
    required: false,
    describe: 'the rpc ur for chain id 369',
    default: 'https://rpc.pulsechain.com',
  },
  rpc943: {
    type: 'string',
    required: false,
    describe: 'the rpc ur for chain id 943',
    default: 'https://rpc.v4.testnet.pulsechain.com',
  },
  chain: {
    type: 'string',
    default: 'ethereum',
    describe: 'the chain configuration to utilize',
  },
  coinmarketcap: {
    type: 'string',
    default: '',
    describe: 'the coinmarketcap api key for getting gas estimates',
  },
  tracerVerbosity: {
    type: 'number',
    default: 2,
    describe: 'the default verbosity of the tracer',
  },
  tracerOpcodes: {
    required: false,
    type: 'array',
    default: [
      'STATICCALL',
      'CALL',
      'DELEGATECALL',
      // 'SLOAD',
      // 'SSTORE',
    ],
    describe: 'opcodes used for traacing',
  },
  blockNumber: {
    type: 'number',
    require: false,
    default: 18057421,
  },
  mnemonic: {
    type: 'string',
    require: false,
    default: 'test test test test test test test test test test test junk',
  },
  apiKey: {
    type: 'string',
    require: false,
    default: 'abc',
  },
}).env().parseSync()

export const hexWhale = async (hex: ERC20) => {
  const pulsechainMainnetHexWhale = ethers.getAddress('0x5280aa3cF5D6246B8a17dFA3D75Db26617B73937')
  const ethereumMainnetHexWhale = ethers.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')
  const whaleBalanceOf = await hex.balanceOf(pulsechainMainnetHexWhale)
  return whaleBalanceOf > ethers.parseUnits('1000000', 8)
    ? pulsechainMainnetHexWhale
    : ethereumMainnetHexWhale
}

export const hexAddress = ethers.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')

export const hedronAddress = ethers.getAddress('0x3819f64f282bf135d62168C1e513280dAF905e06')

export const communisAddress = ethers.getAddress('0x5A9780Bfe63f3ec57f01b087cD65BD656C9034A8')
