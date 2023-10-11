import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"
import { getSigner } from "./utils";

type Input = {
  as: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const signer = await getSigner(hre, args.as)
  const nonce = await waitUntilNonce(signer.provider, signer.address, 1).catch(() => null)
  if (_.isNil(nonce)) return
  const StakeManager = await hre.ethers.getContractFactory('StakeManager', signer)
  const overrides = defaultOverrides(await hre.ethers.provider.getFeeData())
  const stakeManager = await StakeManager.deploy({
    nonce,
    ...overrides,
  })
  const tx = stakeManager.deploymentTransaction()!
  await tx.wait()
  console.log('@%o StakeManager() -> %o @ %o',
    nonce,
    await stakeManager.getAddress(),
    tx.hash,
  )
}
