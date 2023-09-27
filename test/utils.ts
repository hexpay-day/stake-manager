import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"
import type { IHEX } from "../artifacts/types/contracts/interfaces/IHEX"
import * as hre from 'hardhat'
import _ from "lodash"
import * as ethers from 'ethers'
import * as Chai from "chai"
import * as config from '../src/config'
import { IHedron, IERC20, IERC20Metadata, IHEXStakeInstanceManager } from "../artifacts/types"
import { HSIStartEvent } from "../artifacts/types/contracts/interfaces/IHEXStakeInstanceManager"

Chai.Assertion.addMethod('printGasUsage', function (this: any, throws = true) {
  let subject = this._obj
  if (typeof subject === "function") {
    subject = subject()
  }
  const target: ethers.providers.TransactionResponse | Promise<ethers.providers.TransactionResponse> = subject
  const printGasUsed = async (
    [tx]:
    [ethers.providers.TransactionResponse],
  ) => {
    const receipt = await tx.wait()
    hre.tracer.enabled = true
    await hre.run('trace', {
      hash: receipt.transactionHash,
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

export const deployFixture = async () => {
  const Utils = await hre.ethers.getContractFactory('Utils')
  const utils = await Utils.deploy()
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const stakeManager = await StakeManager.deploy()
  await stakeManager.deployed()
  const _signers = await hre.ethers.getSigners()
  const signers = _signers.slice(0, 20)
  const [signer] = signers
  const hex = await hre.ethers.getContractAt('contracts/interfaces/IHEX.sol:IHEX', config.hexAddress) as IHEX
  const hedron = await hre.ethers.getContractAt('contracts/interfaces/IHedron.sol:IHedron', config.hedronAddress) as IHedron
  const hsim = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim())
  const TransferReceiver = await hre.ethers.getContractFactory('TransferReceiver')
  const transferReceiver = await TransferReceiver.deploy()
  const ExistingStakeManager = await hre.ethers.getContractFactory('ExistingStakeManager')
  const existingStakeManager = await ExistingStakeManager.deploy()
  const maximusStakeManager = existingStakeManager
  const decimals = await hex.decimals()
  const oneMillion = hre.ethers.utils.parseUnits('1000000', decimals).toBigInt()
  const hexWhale = await config.hexWhale(hre)
  await hre.vizor.impersonate(hexWhale, async (swa) => {
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
  const usdc = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', usdcAddress) as IERC20Metadata
  const multicall = await hre.ethers.getContractAt('IMulticall3', '0xcA11bde05977b3631167028862bE2a173976CA11')
  const MockExternalPerpetualFilter = await hre.ethers.getContractFactory('MockExternalPerpetualFilter')
  const externalPerpetualFilter = await MockExternalPerpetualFilter.deploy()
  await externalPerpetualFilter.deployed()
  const MockPerpetual = await hre.ethers.getContractFactory('MockPerpetual')
  const mockPerpetual = await MockPerpetual.deploy()
  await mockPerpetual.deployed()
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
    utils,
    maximusStakeManager,
    base,
    hedron,
    hsim,
    existingStakeManager,
  }
}

export const nextStakeId = async (hex: IHEX) => {
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  return stakeIdBN.toBigInt() + 1n
}

export const endOfBaseFixture = async () => {
  return await endOfBaseFixtureOffset()()
}

export const endOfBaseFixtureOffset = (offset = 0) => async function a() {
  const x = await loadFixture(deployFixture)
  const currentDay = await x.hex.currentDay()
  const stake = await x.hex.stakeLists(x.base, 0)
  const endDay = stake.stakedDays + stake.lockedDay
  const daysToEnd = endDay - currentDay.toNumber() - offset
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

export type HSITarget = {
  hsiAddress: string;
  stakeId: bigint;
  tokenId: bigint;
  hsiIndex: bigint;
}

export const deployAndProcureHSIFixture = async () => {
  const x = await loadFixture(deployFixture)
  const [signerA] = x.signers
  const nxtStkId = await nextStakeId(x.hex)

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
      tokenId: tokenId.toBigInt(),
      hsiIndex: addrToId.get(target.hsiAddress) as bigint,
    } as HSITarget
  }))
  await x.hsim.setApprovalForAll(x.existingStakeManager.address, true)
  return {
    ...x,
    hsiTargets: hsiTargets.reverse(),
  }
}

interface X {
  hex: IHEX;
  signers: SignerWithAddress[];
}

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

type LeechUSDC = {
  whales: {
    usdc: string;
  }
  usdc: IERC20;
}

export const leechUsdc = async (amount: bigint, to: string, x: LeechUSDC) => {
  await hre.vizor.impersonate(x.whales.usdc, async (swa) => {
    await x.usdc.connect(swa).transfer(to, amount)
  })
}

export const absMinInt16 = 2n**15n // zero point for int16

export const DAY = 1000*60*60*24

export const receiptToHsiAddress = async (hsim: IHEXStakeInstanceManager, tx: ethers.ContractTransaction) => {
  const receipt = await tx.wait()
  const stakeStartEvent = _(receipt.logs)
    .map((log) => {
      try {
        const l = hsim.interface.parseLog(log)
        if (l.name === 'HSIStart') return l
      } catch (err) {}
    })
    .compact()
    .first() as unknown as HSIStartEvent
  return stakeStartEvent.args.hsiAddress
}
