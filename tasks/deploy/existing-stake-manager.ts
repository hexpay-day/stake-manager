import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"

export const main = async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  const nonce = await waitUntilNonce(signer, 0).catch(() => null)
  if (_.isNil(nonce)) return
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager')
  const overrides = await defaultOverrides(hre)
  const existingStakeManager = await ExistingStakeManager.deploy({
    nonce,
    ...overrides,
  })
  await existingStakeManager.deployed()
  console.log('@%o ExistingStakeManager() -> %o @ %o',
    nonce,
    existingStakeManager.address,
    existingStakeManager.deployTransaction.hash,
  )
}
