import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"

export const main = async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  let nonce = await waitUntilNonce(signer, 2).catch(() => null)
  if (_.isNil(nonce)) return
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory')
  const overrides = await defaultOverrides(hre)
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy({
    nonce,
    ...overrides,
  })
  await isolatedStakeManagerFactory.deployed()
  console.log('@%o IsolatedStakeManagerFactory() -> %o @ %o',
    nonce,
    isolatedStakeManagerFactory.address,
    isolatedStakeManagerFactory.deployTransaction.hash,
  )
}
