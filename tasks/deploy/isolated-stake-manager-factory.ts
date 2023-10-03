import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"

export const main = async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  let nonce = await waitUntilNonce(signer.provider, signer.address, 2).catch(() => null)
  if (_.isNil(nonce)) return
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory')
  const overrides = defaultOverrides(await hre.ethers.provider.getFeeData())
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy({
    nonce,
    ...overrides,
  })
  const tx = isolatedStakeManagerFactory.deploymentTransaction()!
  await tx.wait()
  console.log('@%o IsolatedStakeManagerFactory() -> %o @ %o',
    nonce,
    await isolatedStakeManagerFactory.getAddress(),
    tx.hash,
  )
}
