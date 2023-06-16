import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { impersonateAccount, loadFixture, stopImpersonatingAccount, time } from "@nomicfoundation/hardhat-network-helpers"
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"
import type { IHEX } from "../artifacts/types/contracts/IHEX"
import * as hre from 'hardhat'
import _ from "lodash"

export const hexAddress = hre.ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')

export const pulsexSacrificeAddress = hre.ethers.utils.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')

export const deployFixture = async () => {
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const ConsentualStakeManager = await hre.ethers.getContractFactory('ConsentualStakeManager')
  const stakeManager = await StakeManager.deploy()
  await stakeManager.deployed()
  const _signers = await hre.ethers.getSigners()
  const signers = _signers.slice(0, 20)
  const [signer] = signers
  await impersonateAccount(pulsexSacrificeAddress)
  const pulsexSacrificeSigner = await hre.ethers.getSigner(pulsexSacrificeAddress)
  const hex = await hre.ethers.getContractAt('contracts/IHEX.sol:IHEX', hexAddress, pulsexSacrificeSigner) as IHEX
  // hre.tracer.printNext = true
  const decimals = await hex.decimals()
  const oneMillion = hre.ethers.utils.parseUnits('1000000', decimals).toBigInt()
  await Promise.all(signers.map(async (signer) => {
    await Promise.all([
      // allow infinite flow
      hex.connect(signer)
        .approve(stakeManager.address, hre.ethers.constants.MaxUint256),
      hex.transfer(signer.address, oneMillion),
    ])
  }))
  await stopImpersonatingAccount(pulsexSacrificeAddress)
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory')
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy()
  await isolatedStakeManagerFactory.deployed()
  await isolatedStakeManagerFactory.upsertManager(signer.address)
  const isolatedStakeManagerAddress = await isolatedStakeManagerFactory.isolatedStakeManagers(signer.address)
  const isolatedStakeManager = await hre.ethers.getContractAt('IsolatedStakeManager', isolatedStakeManagerAddress)
  const tx = await hex.connect(signer).approve(isolatedStakeManager.address, oneMillion)
  await tx.wait()
  return {
    nextStakeId: stakeIdBN.toBigInt() + 1n,
    hex,
    decimals,
    oneMillion,
    signers,
    stakeManager,
    StakeManager,
    ConsentualStakeManager,
    isolatedStakeManagerFactory,
    isolatedStakeManager,
  }
}

export const stakeBagAndWait = async () => {
  const x = await loadFixture(deployFixture)
  const days = 30
  const signer = x.signers[x.signers.length - 1]
  const stakedAmount = x.oneMillion / 10n
  await x.isolatedStakeManager.stakeStart(stakedAmount, days)
  await x.isolatedStakeManager.stakeStart(stakedAmount, days + 1)
  await x.isolatedStakeManager.stakeStart(stakedAmount, days + 100)
  await moveForwardDays(days + 1, signer, x)
  return {
    ...x,
    days,
    stakedDays: [days, days + 1, days + 100],
    stakedAmount,
  }
}

export const moveForwardDays = async (
  limit: number,
  signer: SignerWithAddress,
  x: Awaited<ReturnType<typeof deployFixture>>,
) => {
  let i = 0;
  do {
    await time.setNextBlockTimestamp(days(1) + await time.latest())
    await x.hex.connect(signer).stakeStart(hre.ethers.utils.parseUnits('1', 8), 1)
    i += 1
  } while(i < limit)
}

export const addressToBytes32 = (signer: SignerWithAddress) => hre.ethers.utils.hexZeroPad(signer.address.toLowerCase(), 32)

export const deadline = () => Math.floor(_.now() / 1000) + 100
