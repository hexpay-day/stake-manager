import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"
import { getSigner } from "./utils";

type Input = {
  as: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const signer = await getSigner(hre, args.as)
  const nonce = await waitUntilNonce(signer.provider, signer.address, 0).catch(() => null)
  if (_.isNil(nonce)) return
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager', signer)
  const overrides = defaultOverrides(await hre.ethers.provider.getFeeData())
  const existingStakeManager = await ExistingStakeManager.deploy({
    nonce,
    ...overrides,
  })
  const tx = existingStakeManager.deploymentTransaction()!
  await tx.wait()
  console.log('@%o ExistingStakeManager() -> %o @ %o',
    nonce,
    await existingStakeManager.getAddress(),
    tx.hash,
  )
}
