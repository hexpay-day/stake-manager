import * as helpers from '@nomicfoundation/hardhat-network-helpers'

type Input = {
  magnitude: string;
  unit: keyof typeof helpers.time.duration;
}
const units = Object.keys(helpers.time.duration)

export const main = async (args: Input) => {
  if (!units.includes(args.unit)) new Error(`unit must match one of ${units.join(', ')}`)
  const modifier = helpers.time.duration[args.unit]
  await helpers.time.increase(modifier(+args.magnitude))
}
