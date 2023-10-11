import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"
import * as hre from 'hardhat'
import * as ethers from 'ethers'
import _ from "lodash"
import * as Chai from "chai"
import * as config from '../src/config'
import { Hedron, HEXStakeInstanceManager, IsolatedStakeManagerFactory__factory, ExistingStakeManager__factory, TransferReceiver__factory, StakeManager__factory, Utils__factory, MockExternalPerpetualFilter__factory, HEX } from "../artifacts/types"
import { HSIStartEvent } from "../artifacts/types/contracts/interfaces/HEXStakeInstanceManager"
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { ERC20 } from "../artifacts/types/solmate/src/tokens"

Chai.Assertion.addMethod('printGasUsage', function (this: any, throws = true) {
  let subject = this._obj
  if (typeof subject === "function") {
    subject = subject()
  }
  const target: ethers.TransactionResponse | Promise<ethers.TransactionResponse> = subject
  const printGasUsed = async (
    [tx]:
    [ethers.TransactionResponse],
  ) => {
    const receipt = await tx.wait()
    if (!receipt) throw new Error('receipt not found')
    hre.tracer.enabled = true
    await hre.run('trace', {
      hash: receipt.hash,
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

type X = Awaited<ReturnType<typeof deployFixture>>

export const deployFixture = async () => {
  const Utils = await hre.ethers.getContractFactory('Utils') as unknown as Utils__factory
  const utils = await Utils.deploy()
  const StakeManager = await hre.ethers.getContractFactory('StakeManager') as unknown as StakeManager__factory
  const stakeManager = await StakeManager.deploy()
  await stakeManager.deploymentTransaction()?.wait()
  const _signers = await hre.ethers.getSigners()
  const signers = _signers.slice(0, 20)
  const [signer] = signers
  const hex = await hre.ethers.getContractAt('HEX', config.hexAddress) as unknown as HEX
  const hedron = await hre.ethers.getContractAt('Hedron', config.hedronAddress) as unknown as Hedron
  const hsim = await hre.ethers.getContractAt('HEXStakeInstanceManager', await hedron.hsim()) as unknown as HEXStakeInstanceManager
  const TransferReceiver = await hre.ethers.getContractFactory('TransferReceiver') as unknown as TransferReceiver__factory
  const transferReceiver = await TransferReceiver.deploy()
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager') as unknown as ExistingStakeManager__factory
  const existingStakeManager = await ExistingStakeManager.deploy()
  const maximusStakeManager = existingStakeManager
  const decimals = await hex.decimals()
  const oneMillion = hre.ethers.parseUnits('1000000', decimals)
  const hexWhale = await config.hexWhale(hex)
  await hre.vizor.impersonate(hexWhale, async (swa) => {
    const h = hex.connect(swa as unknown as ethers.Signer)
    await Promise.all(signers.map(async (signer) => {
      await Promise.all([
        // allow infinite flow
        hex.connect(signer as unknown as ethers.Signer)
          .approve(stakeManager.getAddress(), hre.ethers.MaxUint256),
        hex.connect(signer as unknown as ethers.Signer).approve(hsim.getAddress(), hre.ethers.MaxUint256),
        h.transfer(signer.address, oneMillion),
      ])
    }))
  })
  const IsolatedStakeManagerFactory = await hre.ethers.getContractFactory('IsolatedStakeManagerFactory') as unknown as IsolatedStakeManagerFactory__factory
  const isolatedStakeManagerFactory = await IsolatedStakeManagerFactory.deploy()
  await isolatedStakeManagerFactory.deploymentTransaction()?.wait()
  await isolatedStakeManagerFactory.createIsolatedManager(signer.address)
  const isolatedStakeManagerAddress = await isolatedStakeManagerFactory.isolatedStakeManagers(signer.address)
  const isolatedStakeManager = await hre.ethers.getContractAt('IsolatedStakeManager', isolatedStakeManagerAddress)
  const tx = await hex.connect(signer as unknown as ethers.Signer).approve(isolatedStakeManager.getAddress(), oneMillion)
  await tx.wait()
  const base = '0xe9f84d418B008888A992Ff8c6D22389C2C3504e0'
  const stakedAmount = oneMillion / 10n
  const usdcAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const usdc = await hre.ethers.getContractAt('solmate/src/tokens/ERC20.sol:ERC20', usdcAddress) as unknown as ERC20
  const multicall = await hre.ethers.getContractAt('IMulticall3', '0xcA11bde05977b3631167028862bE2a173976CA11')
  const MockExternalPerpetualFilter = await hre.ethers.getContractFactory('MockExternalPerpetualFilter') as unknown as MockExternalPerpetualFilter__factory
  const externalPerpetualFilter = await MockExternalPerpetualFilter.deploy()
  await externalPerpetualFilter.deploymentTransaction()?.wait()
  const MockPerpetual = await hre.ethers.getContractFactory('MockPerpetual')
  const mockPerpetual = await MockPerpetual.deploy()
  await mockPerpetual.deploymentTransaction()?.wait()
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  return {
    transferReceiver,
    mockPerpetual,
    externalPerpetualFilter,
    multicall,
    usdc,
    usdcAddress,
    whales: {
      usdc: '0x55FE002aefF02F77364de339a1292923A15844B8',
      hex: hexWhale,
    },
    stakedAmount,
    nextStakeId: stakeIdBN + 1n,
    oneEther: hre.ethers.parseEther('1'),
    hex,
    hedron,
    decimals,
    oneMillion,
    signers,
    stakeManager,
    StakeManager,
    isolatedStakeManagerFactory,
    isolatedStakeManager,
    utils,
    maximusStakeManager,
    base,
    hsim,
    existingStakeManager,
  }
}

export const nextStakeId = async (hex: HEX) => {
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  return stakeIdBN + 1n
}

export const endOfBaseFixture = async () => {
  return await endOfBaseFixtureOffset()()
}

export const endOfBaseFixtureOffset = (offset = 0n) => async function a() {
  const x = await loadFixture(deployFixture)
  const currentDay = await x.hex.currentDay()
  const stake = await x.hex.stakeLists(x.base, 0)
  const endDay = stake.stakedDays + stake.lockedDay
  const daysToEnd = endDay - currentDay - offset
  await moveForwardDays(daysToEnd, x, 14n)
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
  const days = 30n
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days)
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days + 1n)
  await x.isolatedStakeManager.stakeStart(x.stakedAmount, days + 100n)
  const nsid = x.nextStakeId
  const stakeIds = [nsid, nsid + 1n, nsid + 2n, nsid + 3n]
  await moveForwardDays(days + 1n, x)
  const [, , , , , , stakeIdBN] = await x.hex.globalInfo()
  return {
    ...x,
    days,
    stakedDays: [days, days + 1n, days + 100n],
    nextStakeId: stakeIdBN + 1n,
    stakeIds,
  }
}

export const stakeSingletonBagAndWait = async () => {
  const x = await loadFixture(deployFixture)
  const days = 30n
  await x.stakeManager.stakeStart(x.stakedAmount, days)
  await x.stakeManager.stakeStart(x.stakedAmount, days + 1n)
  await x.stakeManager.stakeStart(x.stakedAmount, days + 100n)
  const nsid = x.nextStakeId
  const stakeIds = [nsid, nsid + 1n, nsid + 2n]
  await moveForwardDays(days + 1n, x)
  const [, , , , , , stakeIdBN] = await x.hex.globalInfo()
  return {
    ...x,
    days,
    stakedDays: [days, days + 1n, days + 100n],
    nextStakeId: stakeIdBN + 1n,
    stakeIds,
  }
}

export type HSITarget = {
  hsiAddress: string;
  stakeId: bigint;
  tokenId: bigint;
  hsiIndex: bigint;
}

export const deployAndProcureHSIFixture = async () => {
  const x = await loadFixture(deployFixture)
  const nxtStkId = await nextStakeId(x.hex)
  await x.hsim.hexStakeStart(x.stakedAmount, 29)
  await x.hsim.hexStakeStart(x.stakedAmount, 59)
  await x.hsim.hexStakeStart(x.stakedAmount, 89)
  return procureHSIFixture(x, nxtStkId)
}

export const deployAndProcureSequentialDayHSIFixture = async () => {
  const x = await loadFixture(deployFixture)
  const nxtStkId = await nextStakeId(x.hex)
  await x.hsim.hexStakeStart(x.stakedAmount, 87)
  await x.hsim.hexStakeStart(x.stakedAmount, 88)
  await x.hsim.hexStakeStart(x.stakedAmount, 89)
  return procureHSIFixture(x, nxtStkId)
}

export const procureHSIFixture = async (x: X, nxtStkId: bigint) => {
  const [signerA] = x.signers
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
    const index = count - 1n
    const target = hsiTargetsPartial[hsiTargetsPartial.length - 1 - i]
    await x.hsim.hexStakeTokenize(index, target.hsiAddress)
    addrToId.set(target.hsiAddress, index)
  }
  const hsiTargets = await Promise.all(hsiTargetsPartial.reverse().map(async (target, index) => {
    const tokenId = await x.hsim.tokenOfOwnerByIndex(signerA.address, index)
    return {
      ...target,
      tokenId: tokenId,
      hsiIndex: addrToId.get(target.hsiAddress) as bigint,
    } as HSITarget
  }))
  await x.hsim.setApprovalForAll(x.existingStakeManager.getAddress(), true)
  return {
    ...x,
    hsiTargets: hsiTargets.reverse(),
  }
}

interface MinimalX {
  hex: HEX;
  signers: SignerWithAddress[];
}

export const moveForwardDays = async (
  limit: bigint,
  x: MinimalX,
  step = 1n,
) => {
  if (limit < 1n) return
  const currentDay = await x.hex.currentDay()
  const endDay = currentDay + limit
  let movedToDay = currentDay
  // last signer is utilized as a standin for "the public"
  const lastSigner = x.signers[x.signers.length - 1]
  let numDaysToMove = step
  do {
    if (movedToDay + numDaysToMove > endDay) {
      numDaysToMove = 1n
    }
    await time.setNextBlockTimestamp(days(Number(numDaysToMove)) + await time.latest())
    await x.hex.connect(lastSigner as unknown as ethers.Signer).stakeStart(hre.ethers.parseUnits('1', 8), 1)
    movedToDay += numDaysToMove
  } while(movedToDay < endDay)
}

export const addressToBytes32 = (signer: SignerWithAddress) => toBytes32(signer.address)

export const numberToBytes32 = (num: bigint) => hre.ethers.zeroPadValue(`0x${num.toString(16)}`, 32)

export const toBytes32 = (addr: string) => hre.ethers.zeroPadValue(addr.toLowerCase(), 32)

export const deadline = () => Math.floor(_.now() / 1000) + 100

type LeechUSDC = {
  whales: {
    usdc: string;
  }
  usdc: ERC20;
}

export const leechUsdc = async (amount: bigint, to: string, x: LeechUSDC) => {
  await hre.vizor.impersonate(x.whales.usdc, async (swa) => {
    await x.usdc.connect(swa as unknown as ethers.Signer).transfer(to, amount)
  })
}

export const absMinInt16 = 2n**15n // zero point for int16

export const DAY = 1000*60*60*24

export const receiptToHsiAddress = async (hsim: HEXStakeInstanceManager, tx: ethers.TransactionResponse) => {
  const receipt = await tx.wait()
  if (!receipt) throw new Error('unable to find receipt')
  const stakeStartEvent = _(receipt.logs)
    .map((log) => {
      try {
        const l = hsim.interface.parseLog(log as any)
        if (l?.name === 'HSIStart') return l
      } catch (err) {}
    })
    .compact()
    .first() as unknown as HSIStartEvent.LogDescription
  return stakeStartEvent.args.hsiAddress
}

export const anyUintNoPenalty = (i: any) => {
  anyUint(i)
  const n = i.isBigNumber ? i : BigInt(i)
  const penalty = BigInt.asUintN(72, n)
  if (penalty > 0n) {
    throw new Chai.AssertionError(
      `anyUintNoPenalty expected its argument to be zero, but it was value ${n}`
    );
  }
  return true
}
