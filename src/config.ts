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
}).env().parseSync()
