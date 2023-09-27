import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CallOverrides } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { setTimeout } from "timers/promises";

export const waitUntilNonce = async (signer: SignerWithAddress, nonce: number) => {
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

export const defaultOverrides = async (hre: HardhatRuntimeEnvironment): Promise<CallOverrides> => {
  const gasInfo = await hre.ethers.provider.getFeeData()
  const maxFeePerGas = gasInfo.maxFeePerGas?.toBigInt() as bigint
  const maxPriorityFeePerGas = maxFeePerGas / 10n
  return {
    type: 2,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: 10_000_000n,
  }
}
