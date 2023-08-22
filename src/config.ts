import dotenv from 'dotenv'
dotenv.config()
import * as yargs from 'yargs'

Error.stackTraceLimit = Infinity

export const args = yargs.options({
  chain: {
    type: 'string',
    default: 'pulsechainV4',
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
  viaIR: {
    required: false,
    type: 'boolean',
    default: false,
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
}).env().parseSync()
