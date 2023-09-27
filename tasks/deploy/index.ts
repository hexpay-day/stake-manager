import { HardhatRuntimeEnvironment } from "hardhat/types";

type Input = {
  stopAt: string;
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
  const [signer] = await hre.ethers.getSigners()
  console.log('signing with %o', signer.address)
  for (let i = 0; i < stoppingAt; i++) {
    await hre.run(`deploy:${tasks[i]}`)
  }
}
