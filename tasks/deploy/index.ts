import { HardhatRuntimeEnvironment } from "hardhat/types";

type Input = {
  stopAt: string;
  as: string;
}

const tasks = [
  'existing-stake-manager',
  'stake-manager',
  'isolated-stake-manager-factory',
  // must always be last
  'none',
]

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const stoppingAt = tasks.indexOf(args.stopAt)
  for (let i = 0; i < stoppingAt; i++) {
    await hre.run(`deploy:${tasks[i]}`, {
      as: args.as,
    })
  }
}
