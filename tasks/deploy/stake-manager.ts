import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"

export const main = async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  const nonce = await waitUntilNonce(signer.provider, signer.address, 1).catch(() => null)
  if (_.isNil(nonce)) return
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
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
