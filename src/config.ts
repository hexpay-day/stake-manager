import dotenv from 'dotenv'
dotenv.config()
import * as yargs from 'yargs'

export const args = yargs.options({
  network: {
    type: 'string',
    default: 'pulsechainV4',
    describe: 'the network configuration to utilize',
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
    ],
    describe: 'opcodes used for traacing',
  },
}).env().parseSync()
