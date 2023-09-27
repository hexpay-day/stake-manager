import { HardhatRuntimeEnvironment } from "hardhat/types"
import { defaultOverrides, waitUntilNonce } from "../../src/utils"
import _ from "lodash"

export const main = async (_args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  const nonce = await waitUntilNonce(signer, 1).catch(() => null)
  if (_.isNil(nonce)) return
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const overrides = await defaultOverrides(hre)
  const stakeManager = await StakeManager.deploy({
    nonce,
    ...overrides,
  })
  await stakeManager.deployed()
  console.log('@%o StakeManager() -> %o @ %o',
    nonce,
    stakeManager.address,
    stakeManager.deployTransaction.hash,
  )
}
