import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as utils from './utils'
import { IUnderlyingStakeable } from '../artifacts/types/contracts/interfaces/HEX'
import { linear } from "../src/utils"

describe('Magnitude.sol', () => {
  const principle = hre.ethers.parseUnits('100', 8)
  const xOverYPlusB = {
    xFactor: 1n,
    x: 3n,
    yFactor: 0n,
    y: 40n,
    bFactor: 0n,
    b: -500n,
  }
  const negXOverYPlusB = {
    method: 0n,
    xFactor: 1n,
    x: -3n,
    yFactor: 0n,
    y: 40n,
    bFactor: 0n,
    b: 500n,
  }

  const yieldFromPrinciple = principle/10n
  const principleAndYield = principle+yieldFromPrinciple
  const noLimit = hre.ethers.MaxUint256
  const stake: IUnderlyingStakeable.StakeStoreStruct = {
    stakeId: 0n,
    stakedDays: 10n,
    lockedDay: 1000n,
    stakedHearts: principle,
    stakeShares: 1_000n**2n, // 1 m-share
    unlockedDay: 0n,
    isAutoStake: false,
  }
  let x!: Awaited<ReturnType<typeof utils.deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(utils.deployFixture)
  })
  describe('computeDayMagnitude', () => {
    it('limited by first arg', async () => {
      await expect(x.stakeManager.computeDayMagnitude(100, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([1, 100])
    })
    it('returns zero if limit is zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(0, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([1, 0])
    })
    it('returns zero if method is zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(100, 0, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([0, 0])
    })
    it('0: always returns zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 0, 100, 100, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([0, 0])
    })
    it('1: always returns arg 1', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([1, 1001])
    })
    it('2: returns the staked days property', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 2, 0, 0, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([2, 10])
    })
    it('3: returns a computed day based on a tight ladder', async () => {
      let currentDay!: bigint
      let stk!: IUnderlyingStakeable.StakeStoreStruct
      currentDay = (await x.hex.currentDay())
      stk = {
        ...stake,
        lockedDay: currentDay - 10n,
      }
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, stk.lockedDay, stk.stakedDays))
        .eventually.to.deep.equal([3, stk.stakedDays])
      // missed end by more than 1 round
      currentDay = (await x.hex.currentDay())
      stk = {
        ...stake,
        lockedDay: currentDay - 26n,
      }
      // t-26 => 1 full round = t-26 + stakedDays + 1 = t-26 + 10 + 1
      // therefore, last (missed) ladder iterations:
      // t-26,t-15,t-4
      // so we are 4 days into the ladder, so we should stake for
      // 5 more days to get us back on track (lockedDay = currentDay + 1)
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, stk.lockedDay, stk.stakedDays))
        .eventually.to.deep.equal([4, 5])
    })
    it('3: works even if the magnitude would otherwise be zero', async () => {
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 2, 0, 0, stake.lockedDay, stake.stakedDays))
        .eventually.to.deep.equal([2, 10])
    })
    it('3: returns number of staked days if match', async () => {
      // missed end by more than 1 round
      const currentDay = (await x.hex.currentDay())
      // zero day
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, currentDay - 21n, 10))
        .eventually.to.deep.equal([3, 10])
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, currentDay - 22n, 10))
        .eventually.to.deep.equal([4, 9])
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, currentDay - 23n, 10))
        .eventually.to.deep.equal([4, 8])
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, currentDay - 19n, 10))
        .eventually.to.deep.equal([4, 1])
      // will fail if check for zero is not in place
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 0, currentDay, currentDay - 20n, 10))
        .eventually.to.deep.equal([4, 0])
    })
    it('3: returns an adjusted number if lower than x', async () => {
      const currentDay = (await x.hex.currentDay())
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 1, currentDay, currentDay - 20n, 10))
        .eventually.to.deep.equal([4, 11])
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 2, currentDay, currentDay - 19n, 10))
        .eventually.to.deep.equal([4, 12])
    })
    it('4: is contract controlled and acts as a flag for the user to re-establish ladder', async () => {
      let currentDay = (await x.hex.currentDay())
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 3, 2, currentDay, currentDay - 19n, 10))
        .eventually.to.deep.equal([4, 12])
      // end stake in 12+1 days
      const nextStartDay = currentDay
      const nextLockedDay = nextStartDay + 1n
      const stakedDays = 12n
      const nextEndDay = 11n + nextLockedDay + stakedDays
      // late again - only
      currentDay = nextEndDay + 9n
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 4, 2, currentDay, currentDay - 19n, stakedDays))
        .eventually.to.deep.equal([4, 0])
    })
  })
  const l = {
    method: 0n,
    xFactor: 0n,
    x: 0n,
    yFactor: 0n,
    y: 0n,
    bFactor: 0n,
    b: 0n,
  }
  describe('computeMagnitude', () => {
    it('returns zero if limit is zero', async () => {
      await expect(x.stakeManager.computeMagnitude(0, linear.encode({ ...l, method: 1n, y: 1001n, }), 1002, principle))
        .eventually.to.equal(0)
    })
    it('returns zero if method is zero', async () => {
      await expect(x.stakeManager.computeMagnitude(100, linear.encode({ ...l, method: 0n, y: 1001n, }), 1002, principle))
        .eventually.to.equal(0)
    })
    it('limited by first arg', async () => {
      await expect(x.stakeManager.computeMagnitude(100, linear.encode({ ...l, method: 1n, y: 1001n, }), 1002, principle))
        .eventually.to.equal(100)
    })
    it('handles inverted y\'s', async () => {
      // because y2 < y1, only offset remains
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode({ ...l, method: 2n, xFactor: 1n, y: 100n, }), principle, principleAndYield))
        .eventually.to.equal(0)
    })
    it('0: always returns zero', async () => {
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode({ ...l, method: 0n, y: 100n, }), 100, principle))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode({ ...l, method: 1n, y: 1001n, }), 1002, principle))
        .eventually.to.equal(1001)
    })
    it('2: returns the y2 value', async () => {
      // do not sub 1 from the x input - needed to ensure rounding correctly
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode({ ...l, method: 2n, y: 1001n, }), 1002, principle))
        .eventually.to.equal(1002)
    });
    ([0n, 1n, 2n, 3n]).forEach((xFactor: bigint) => {
      const flattened = 3n+(xFactor*3n)
      it(`${flattened}: uses (x/y)+b as a further bitpacked value with total and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(
          noLimit,
          linear.encode({ ...xOverYPlusB, method: 0n, xFactor: xFactor + 1n, }),
          principleAndYield,
          principle,
        ))
          .eventually.to.equal(((principleAndYield * 3n * (2n**xFactor)) / 40n) - 500n)
      })
      it(`${flattened+1n}: uses (x/y)+b as a further bitpacked value with principle and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(
          noLimit,
          linear.encode({ ...xOverYPlusB, method: 1n, xFactor: xFactor + 1n, }),
          principleAndYield,
          principle,
        ))
          .eventually.to.equal(((principle * 3n * (2n**xFactor)) / 40n) - 500n)
      })
      it(`${flattened+2n}: uses (x/y)+b as a further bitpacked value with yield and x increased ${2n**xFactor}x`, async () => {
        await expect(x.stakeManager.computeMagnitude(
          noLimit,
          linear.encode({ ...xOverYPlusB, method: 2n, xFactor: xFactor + 1n, }),
          principleAndYield,
          principle,
        ))
          .eventually.to.equal(((yieldFromPrinciple * 3n * (2n**xFactor)) / 40n) - 500n)
      })
    })
    it('can only handle non zero y', async () => {
      const y2 = 1n
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode(negXOverYPlusB), 1n, 0))
        .eventually.to.equal(((y2 * -3n) / 40n) + 500n)
    })
    it('can handle negative numbers resulting from an xyb curve', async () => {
      let y2 = 150n
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode(negXOverYPlusB), y2, 0))
        .eventually.to.equal(((y2 * -3n) / 40n) + 500n)
      y2 = 6_667n
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode(negXOverYPlusB), y2, 0))
        .eventually.to.equal(0n)
      y2 = 10_000n
      await expect(x.stakeManager.computeMagnitude(noLimit, linear.encode(negXOverYPlusB), y2, 0))
        .eventually.to.equal(0n)
    })
  })
  const line = {
    method: 0n,
    xFactor: 1n,
    x: 3n,
    yFactor: 0n,
    y: 40n,
    bFactor: 0n,
    b: -500n,
  }
  describe('encode/decodeLinear', async () => {
    it('can equally encode and decode inputs', async () => {
      const xOverYPlusBEncoded = linear.encode(line)
      expect(linear.decode(xOverYPlusBEncoded)).to.be.deep.equal(line)
    })
    it('adds a power factor with other inputs', async () => {
      const skewedLine = {
        method: 0n,
        xFactor: 3n,
        x: 3n,
        yFactor: 4n,
        y: 40n,
        bFactor: 3n,
        b: -500n,
      }
      const xOverYPlusBEncoded = linear.encode(skewedLine)
      expect(linear.decode(xOverYPlusBEncoded)).to.deep.equal(skewedLine)
    })
    describe('encodeLinear', () => {
      it('disallows methods with value > 2', async () => {
        expect(() => linear.encode({
          ...negXOverYPlusB,
          method: 3n,
        }))
        .to.throw('NotAllowed')
      })
    })
  })
})
