import dotenv from 'dotenv'
import { ethers } from 'ethers'
dotenv.config()
import * as yargs from 'yargs'

Error.stackTraceLimit = Infinity

export const args = yargs.options({
  chain: {
    type: 'string',
    default: 'pulsechain',
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
  },
  mnemonic: {
    type: 'string',
    require: false,
    default: 'test test test test test test test test test test test junk',
  },
}).env().parseSync()

export const hexWhale = (chainId: number) => {
  return chainId === 369
    ? ethers.utils.getAddress('0x5280aa3cF5D6246B8a17dFA3D75Db26617B73937')
    // works for #1+#943
    : ethers.utils.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')
}
