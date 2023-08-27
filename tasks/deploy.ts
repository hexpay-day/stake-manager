import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { setTimeout } from "timers/promises";

export const main = async (args: any, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  const addr = await signer.getAddress()
  console.log('deployer %o', addr)
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager')
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory')
  let nonce = await waitUntilNonce(signer, 0)
  const existingStakeManager = await ExistingStakeManager.deploy({
    nonce,
    type: 2,
  })
  await existingStakeManager.deployed()
  console.log('@%o ExistingStakeManager() -> %o @ %o', nonce, existingStakeManager.address, existingStakeManager.deployTransaction.hash)
  nonce = await waitUntilNonce(signer, 1)
  const stakeManager = await StakeManager.deploy({
    nonce,
    type: 2,
  })
  await stakeManager.deployed()
  console.log('@%o StakeManager() -> %o @ %o', nonce, stakeManager.address, stakeManager.deployTransaction.hash)
  nonce = await waitUntilNonce(signer, 2)
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy({
    nonce,
    type: 2,
  })
  await isolatedStakeManagerFactory.deployed()
  console.log('@%o IsolatedStakeManagerFactory() -> %o @ %o', nonce, isolatedStakeManagerFactory.address, isolatedStakeManagerFactory.deployTransaction.hash)
}

const waitUntilNonce = async (signer: SignerWithAddress, nonce: number) => {
  let shouldWait!: boolean
  do {
    const txCountLatest = await signer.getTransactionCount('latest')
    const txCountPending = await signer.getTransactionCount('pending')
    if (txCountLatest > nonce) {
      console.log('requested=%o latest=%o pending=%o', nonce, txCountLatest, txCountPending)
      throw new Error('nonce has passed')
    }
    if (txCountLatest < txCountPending) {
      console.log('nonce discrepancy latest=%o pending=%o', txCountLatest, txCountPending)
      await setTimeout(10_000)
      shouldWait = true
      continue
    }
    if (txCountLatest === nonce) {
      shouldWait = false
    }
  } while (shouldWait);
  return nonce
}
