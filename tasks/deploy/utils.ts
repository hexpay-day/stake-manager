import * as helpers from '@nomicfoundation/hardhat-network-helpers'
import { HardhatRuntimeEnvironment } from "hardhat/types"

export const getSigner = async (hre: HardhatRuntimeEnvironment, as: string) => {
  let [signer] = await hre.ethers.getSigners()
  if (as) {
    const w = hre.ethers.Wallet.fromPhrase(as)
    await helpers.impersonateAccount(w.address)
    signer = await hre.ethers.getSigner(w.address)
  }
  return signer
}