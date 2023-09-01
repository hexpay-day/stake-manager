import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"
import type { IHEX } from "../artifacts/types/contracts/interfaces/IHEX"
import * as hre from 'hardhat'
import _ from "lodash"
import * as ethers from 'ethers'
import * as Chai from "chai"
import * as config from '../src/config'

Chai.Assertion.addMethod('printGasUsage', function (this: any) {
  let subject = this._obj
  if (typeof subject === "function") {
    subject = subject()
  }
  const target: ethers.providers.TransactionResponse | Promise<ethers.providers.TransactionResponse> = subject
  const printGasUsed = async (
    [tx]:
    [ethers.providers.TransactionResponse],
  ) => {
    hre.tracer.enabled = true
    await hre.run('trace', {
      hash: tx.hash,
      fulltrace: true,
    })
    hre.tracer.enabled = false
  }
  const derivedPromise = Promise.all([
    target,
  ])
    .then(printGasUsed)

  this.then = derivedPromise.then.bind(derivedPromise)
  this.catch = derivedPromise.catch.bind(derivedPromise)
  return this
})

export const hexAddress = hre.ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')

export const hedronAddress = hre.ethers.utils.getAddress('0x3819f64f282bf135d62168C1e513280dAF905e06')

export const pulsexSacrificeAddress = hre.ethers.utils.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')

export const deployFixture = async () => {
  const Capable = await hre.ethers.getContractFactory('Capable')
  const capable = await Capable.deploy()
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const stakeManager = await StakeManager.deploy()
  await stakeManager.deployed()
  const _signers = await hre.ethers.getSigners()
  const signers = _signers.slice(0, 20)
  const [signer] = signers
  const hex = await hre.ethers.getContractAt('contracts/interfaces/IHEX.sol:IHEX', hexAddress) as IHEX
  const hedron = await hre.ethers.getContractAt('IHedron', hedronAddress)
  const hsim = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim())
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager')
  const hsiStakeManager = await ExistingStakeManager.deploy()
  const maximusStakeManager = hsiStakeManager
  const decimals = await hex.decimals()
  const oneMillion = hre.ethers.utils.parseUnits('1000000', decimals).toBigInt()
  const hexWhale = await config.hexWhale(hex)
  await hre.vizor.impersonate(pulsexSacrificeAddress, async (swa) => {
    const h = hex.connect(swa)
    await Promise.all(signers.map(async (signer) => {
      await Promise.all([
        // allow infinite flow
        hex.connect(signer)
          .approve(stakeManager.address, hre.ethers.constants.MaxUint256),
        hex.connect(signer).approve(hsim.address, hre.ethers.constants.MaxUint256),
        h.transfer(signer.address, oneMillion),
      ])
    }))
  })
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory')
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy()
  await isolatedStakeManagerFactory.deployed()
  await isolatedStakeManagerFactory.createIsolatedManager(signer.address)
  const isolatedStakeManagerAddress = await isolatedStakeManagerFactory.isolatedStakeManagers(signer.address)
  const isolatedStakeManager = await hre.ethers.getContractAt('IsolatedStakeManager', isolatedStakeManagerAddress)
  const tx = await hex.connect(signer).approve(isolatedStakeManager.address, oneMillion)
  await tx.wait()
  const base = '0xe9f84d418B008888A992Ff8c6D22389C2C3504e0'
  const stakedAmount = oneMillion / 10n
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const usdc = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', usdcAddress)
  return {
    usdc,
    usdcAddress,
    whales: {
      usdc: '0x55FE002aefF02F77364de339a1292923A15844B8',
      hex: hexWhale,
    },
    stakedAmount,
    nextStakeId: stakeIdBN.toBigInt() + 1n,
    oneEther: hre.ethers.utils.parseEther('1').toBigInt(),
    hex,
    decimals,
    oneMillion,
    signers,
    stakeManager,
    StakeManager,
    isolatedStakeManagerFactory,
    isolatedStakeManager,
    capable,
    maximusStakeManager,
    base,
    hedron,
    hsim,
    hsiStakeManager,
  }
}

export const nextStakeId = async (x: Awaited<ReturnType<typeof deployFixture>>) => {
  const [, , , , , , stakeIdBN] = await x.hex.globalInfo()
  return stakeIdBN.toBigInt() + 1n
}

export const endOfBaseFixture = async () => {
  const x = await loadFixture(deployFixture)
  const currentDay = await x.hex.currentDay()
  const stake = await x.hex.stakeLists(x.base, 0)
  const endDay = stake.stakedDays + stake.lockedDay
  const daysToEnd = endDay - currentDay.toNumber()
  await moveForwardDays(daysToEnd, x, 14)
  const GasReimberser = await hre.ethers.getContractFactory('GasReimberser')
  const gasReimberser = await GasReimberser.deploy(x.base)
  const publicEndStakeable = await hre.ethers.getContractAt('IPublicEndStakeable', x.base)
  return {
    ...x,
    gasReimberser,
    publicEndStakeable,
  }
}

export const stakeBagAndWait = async () => {
  const x = await loadFixture(deployFixture)
  const days = 30
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days)
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days + 1)
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days + 100)
  const nsid = x.nextStakeId
  const stakeIds = [nsid, nsid + 1n, nsid + 2n, nsid + 3n]
  await moveForwardDays(days + 1, x)
  const [, , , , , , stakeIdBN] = await x.hex.globalInfo()
  return {
    ...x,
    days,
    stakedDays: [days, days + 1, days + 100],
    nextStakeId: stakeIdBN.toBigInt() + 1n,
    stakeIds,
  }
}

export const stakeSingletonBagAndWait = async () => {
  const x = await loadFixture(deployFixture)
  const days = 30
  await x.stakeManager.stakeStart(x.stakedAmount, days)
  await x.stakeManager.stakeStart(x.stakedAmount, days + 1)
  await x.stakeManager.stakeStart(x.stakedAmount, days + 100)
  const nsid = x.nextStakeId
  const stakeIds = [nsid, nsid + 1n, nsid + 2n]
  await moveForwardDays(days + 1, x)
  const [, , , , , , stakeIdBN] = await x.hex.globalInfo()
  return {
    ...x,
    days,
    stakedDays: [days, days + 1, days + 100],
    nextStakeId: stakeIdBN.toBigInt() + 1n,
    stakeIds,
  }
}

export const deployAndProcureHSIFixture = async () => {
  const x = await loadFixture(deployFixture)
  const [signerA] = x.signers
  const nxtStkId = await nextStakeId(x)

  await x.hsim.hexStakeStart(x.stakedAmount, 29)
  await x.hsim.hexStakeStart(x.stakedAmount, 59)
  await x.hsim.hexStakeStart(x.stakedAmount, 89)
  const hsiStakeIds = [
    nxtStkId,
    nxtStkId + 1n,
    nxtStkId + 2n,
  ]
  const hsiAddresses = await Promise.all(hsiStakeIds.map((_stakeId, index) => (
    x.hsim.hsiLists(signerA.address, index)
  )))
  const hsiTargetsPartial = hsiAddresses.map((addr, index) => ({
    hsiAddress: addr,
    stakeId: hsiStakeIds[index],
  }))
  const addrToId = new Map<string, bigint>()
  for (let i = 0; i < hsiTargetsPartial.length; i++) {
    const count = await x.hsim.hsiCount(signerA.address)
    const index = count.toBigInt() - 1n
    const target = hsiTargetsPartial[hsiTargetsPartial.length - 1 - i]
    await x.hsim.hexStakeTokenize(index, target.hsiAddress)
    addrToId.set(target.hsiAddress, index)
  }
  const hsiTargets = await Promise.all(hsiTargetsPartial.reverse().map(async (target, index) => {
    const tokenId = await x.hsim.tokenOfOwnerByIndex(signerA.address, index)
    return {
      ...target,
      tokenId,
      hsiIndex: addrToId.get(target.hsiAddress) as bigint,
    }
  }))
  await x.hsim.setApprovalForAll(x.hsiStakeManager.address, true)
  return {
    ...x,
    hsiTargets: hsiTargets.reverse(),
  }
}

type X = Awaited<ReturnType<typeof deployFixture>>

export const moveForwardDays = async (
  limit: number,
  x: X,
  step = 1,
) => {
  const _currentDay = await x.hex.currentDay()
  const currentDay = _currentDay.toNumber()
  const endDay = currentDay + limit
  let movedToDay = currentDay
  // last signer is utilized as a standin for "the public"
  const lastSigner = x.signers[x.signers.length - 1]
  let numDaysToMove = step
  do {
    if (movedToDay + numDaysToMove > endDay) {
      numDaysToMove = 1
    }
    await time.setNextBlockTimestamp(days(numDaysToMove) + await time.latest())
    await x.hex.connect(lastSigner).stakeStart(hre.ethers.utils.parseUnits('1', 8), 1)
    movedToDay += numDaysToMove
  } while(movedToDay < endDay)
}

export const addressToBytes32 = (signer: SignerWithAddress) => toBytes32(signer.address)

export const numberToBytes32 = (num: bigint) => hre.ethers.utils.hexZeroPad(hre.ethers.BigNumber.from(num).toHexString(), 32)

export const toBytes32 = (addr: string) => hre.ethers.utils.hexZeroPad(addr.toLowerCase(), 32)

export const deadline = () => Math.floor(_.now() / 1000) + 100

export const leechUsdc = async (amount: bigint, to: string, x: X) => {
  await hre.vizor.impersonate(x.whales.usdc, async (swa) => {
    await x.usdc.connect(swa).transfer(to, amount)
  })
}

export const absMinInt16 = 2n**15n // zero point for int16
