import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as utils from './utils'
import { IUnderlyingStakeable } from '../artifacts/types/contracts/interfaces/IHEX'

describe('Magnitude.sol', () => {
  const principle = hre.ethers.utils.parseUnits('100', 8).toBigInt()
  const xOverYPlusB = {
    xFactor: 1,
    x: 3n,
    yFactor: 0,
    y: 40n,
    bFactor: 0,
    b: -500n,
  }
  const negXOverYPlusB = {
    method: 0,
    xFactor: 1,
    x: -3n,
    yFactor: 0,
    y: 40n,
    bFactor: 0,
    b: 500n,
  }

  const yieldFromPrinciple = principle/10n
  const principleAndYield = principle+yieldFromPrinciple
  const noLimit = hre.ethers.constants.MaxUint256
  const stake: IUnderlyingStakeable.StakeStoreStruct = {
    stakeId: 0,
    stakedDays: 10,
    lockedDay: 1000,
    stakedHearts: principle,
    stakeShares: 1_000n**2n, // 1 m-share
    unlockedDay: 0,
    isAutoStake: false,
  }
  let x!: Awaited<ReturnType<typeof utils.deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(utils.deployFixture)
  })
  describe('computeDayMagnitude', () => {
    it('limited by first arg', async () => {
      await expect(x.stakeManager.computeDayMagnitude(100, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(100)
    })
    it('returns zero if limit is zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(0, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(0)
    })
    it('returns zero if method is zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(100, 0, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(0)
    })
    it('0: always returns zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 0, 100, 100, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(1001)
    })
    it('2: returns the staked days property', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 2, 0, 0, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(10)
    })
    it('3: returns a computed day based on a tight ladder', async () => {
      let currentDay!: number
      let stk!: IUnderlyingStakeable.StakeStoreStruct
      currentDay = (await x.hex.currentDay()).toNumber()
      stk = {
        ...stake,
        lockedDay: currentDay - 10,
      }
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, stk.lockedDay, stk.stakedDays))
        .eventually.to.equal(stk.stakedDays)
      // missed end by more than 1 round
      currentDay = (await x.hex.currentDay()).toNumber()
      stk = {
        ...stake,
        lockedDay: currentDay - 26,
      }
      // t-26 => 1 full round = t-26 + stakedDays + 1 = t-26 + 10 + 1
      // therefore, last (missed) ladder iterations:
      // t-26,t-15,t-4
      // so we are 4 days into the ladder, so we should stake for
      // 6 more days to get us back on track
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, stk.lockedDay, stk.stakedDays))
        .eventually.to.equal(6)
    })
  })
  const l = {
    method: 0,
    xFactor: 0,
    x: 0,
    yFactor: 0,
    y: 0,
    bFactor: 0,
    b: 0,
  }
  describe('computeMagnitude', () => {
    it('returns zero if limit is zero', async () => {
      await expect(x.stakeManager.computeMagnitude(0, { ...l, method: 1, y: 1001, }, 1002, principle))
        .eventually.to.equal(0)
    })
    it('returns zero if method is zero', async () => {
      await expect(x.stakeManager.computeMagnitude(100, { ...l, method: 0, y: 1001, }, 1002, principle))
        .eventually.to.equal(0)
    })
    it('limited by first arg', async () => {
      await expect(x.stakeManager.computeMagnitude(100, { ...l, method: 1, y: 1001, }, 1002, principle))
        .eventually.to.equal(100)
    })
    it('handles inverted y\'s', async () => {
      // because y2 < y1, only offset remains
      await expect(x.stakeManager.computeMagnitude(noLimit, { ...l, method: 2, xFactor: 1, y: 100, }, principle, principleAndYield))
        .eventually.to.equal(0)
    })
    it('0: always returns zero', async () => {
      await expect(x.stakeManager.computeMagnitude(noLimit, { ...l, method: 0, y: 100, }, 100, principle))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      await expect(x.stakeManager.computeMagnitude(noLimit, { ...l, method: 1, y: 1001, }, 1002, principle))
        .eventually.to.equal(1001)
    })
    it('2: returns the y2 value', async () => {
      // do not sub 1 from the x input - needed to ensure rounding correctly
      await expect(x.stakeManager.computeMagnitude(noLimit, { ...l, method: 2, y: 1001, }, 1002, principle))
        .eventually.to.equal(1002)
    });
    ([0n, 1n, 2n, 3n]).forEach((xFactor: bigint) => {
      const flattened = 3n+(xFactor*3n)
      it(`${flattened}: uses (x/y)+b as a further bitpacked value with total and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(noLimit, { ...xOverYPlusB, method: 0n, xFactor: xFactor + 1n, }, principleAndYield, principle))
          .eventually.to.equal(((principleAndYield * 3n * (2n**xFactor)) / 40n) - 500n)
      })
      it(`${flattened+1n}: uses (x/y)+b as a further bitpacked value with principle and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(noLimit, { ...xOverYPlusB, method: 1n, xFactor: xFactor + 1n, }, principleAndYield, principle))
          .eventually.to.equal(((principle * 3n * (2n**xFactor)) / 40n) - 500n)
      })
      it(`${flattened+2n}: uses (x/y)+b as a further bitpacked value with yield and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(noLimit, { ...xOverYPlusB, method: 2n, xFactor: xFactor + 1n, }, principleAndYield, principle))
          .eventually.to.equal(((yieldFromPrinciple * 3n * (2n**xFactor)) / 40n) - 500n)
      })
    })
    it('can only handle non zero y', async () => {
      const y2 = 1n
      await expect(x.stakeManager.computeMagnitude(noLimit, negXOverYPlusB, 1n, 0))
        .eventually.to.equal(((y2 * -3n) / 40n) + 500n)
    })
    it('can handle negative numbers resulting from an xyb curve', async () => {
      let y2 = 150n
      await expect(x.stakeManager.computeMagnitude(noLimit, negXOverYPlusB, y2, 0))
        .eventually.to.equal(((y2 * -3n) / 40n) + 500n)
      y2 = 6_667n
      await expect(x.stakeManager.computeMagnitude(noLimit, negXOverYPlusB, y2, 0))
        .eventually.to.equal(0n)
      y2 = 10_000n
      await expect(x.stakeManager.computeMagnitude(noLimit, negXOverYPlusB, y2, 0))
        .eventually.to.equal(0n)
    })
  })
  const line = {
    method: 0,
    xFactor: 1,
    x: 3n,
    yFactor: 0,
    y: 40n,
    bFactor: 0,
    b: -500n,
  }
  describe('encode/decodeLinear', async () => {
    it('can equally encode and decode inputs', async () => {
      const xOverYPlusBEncoded = await x.stakeManager.encodeLinear(line)
      await expect(x.stakeManager.decodeLinear(xOverYPlusBEncoded))
        .eventually.to.be.deep.equal(Object.values(line))
    })
    it('adds a power factor with other inputs', async () => {
      const { stakeManager } = await loadFixture(utils.deployFixture)
      const skewedLine = {
        method: 0,
        xFactor: 3n,
        x: 3n,
        yFactor: 4n,
        y: 40n,
        bFactor: 3n,
        b: -500n,
      }
      const xOverYPlusBEncoded = await stakeManager.encodeLinear(skewedLine)
      await expect(stakeManager.decodeLinear(xOverYPlusBEncoded))
        .eventually.to.deep.equal(Object.values(skewedLine))
    })
  })
})
