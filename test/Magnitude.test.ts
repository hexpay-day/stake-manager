import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as utils from './utils'
import { IUnderlyingStakeable } from '../artifacts/types/contracts/interfaces/IHEX'
import { BigNumberish } from "ethers"

describe('Magnitude.sol', () => {
  const principle = hre.ethers.utils.parseUnits('100', 8).toBigInt()
  const absMinInt16 = 2n**15n // zero point for int24
  const tenPercentNumeratorAsUint = (1_000n << 32n) | 10_000n
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
  describe('computeDayMagnitude', () => {
    it('0: always returns zero', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 0, 100, 100, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 1, 1001, 1002, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(1001)
    })
    it('2: returns the staked days property', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeDayMagnitude(noLimit, 2, 0, 0, stake.lockedDay, stake.stakedDays))
        .eventually.to.equal(10)
    })
    it('3: returns a computed day based on a tight ladder', async () => {
      const x = await loadFixture(utils.deployFixture)
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
  describe('computeMagnitude', () => {
    it('handles inverted y\'s', async () => {
      const x = await loadFixture(utils.deployFixture)
      // because y2 < y1, only offset remains
      await expect(x.stakeManager.computeMagnitude(noLimit, 5, 100, principle, principleAndYield))
        .eventually.to.equal(0)
    })
    it('0: always returns zero', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 0, 100, 100, principle))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 1, 1001, 1002, principle))
        .eventually.to.equal(1001)
    })
    it('2: returns the y2 value', async () => {
      const x = await loadFixture(utils.deployFixture)
      // do not sub 1 from the x input - needed to ensure rounding correctly
      await expect(x.stakeManager.computeMagnitude(noLimit, 2, tenPercentNumeratorAsUint, 10_000_000, principle))
        .eventually.to.equal(10_000_000)
    })
    it('3: returns a % of total', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 3, tenPercentNumeratorAsUint, principleAndYield, principle))
        .eventually.to.equal(principleAndYield / 10n)
    })
    it('4: returns a % of principle', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 4, tenPercentNumeratorAsUint, principleAndYield, principle))
        .eventually.to.equal(principle / 10n)
    })
    it('5: returns a % of yield', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 5, tenPercentNumeratorAsUint, principleAndYield, principle))
        .eventually.to.equal(yieldFromPrinciple / 10n)
    })
    const xOverYPlusB = ( (absMinInt16 + -500n) << 48n ) | ( (absMinInt16 + 3n) << 24n ) | 40n;
    it('6: uses (x/y)+b as a further bitpacked value with total', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 6, xOverYPlusB, principleAndYield, principle))
        .eventually.to.equal(((principleAndYield * 3n) / 40n) - 500n)
    })
    it('7: uses (x/y)+b as a further bitpacked value with principle', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 7, xOverYPlusB, principleAndYield, principle))
        .eventually.to.equal(((principle * 3n) / 40n) - 500n)
    })
    it('8: uses (x/y)+b as a further bitpacked value with yield', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(noLimit, 8, xOverYPlusB, principleAndYield, principle))
        .eventually.to.equal(((yieldFromPrinciple * 3n) / 40n) - 500n)
    })
  })
  describe('encode/decodeLinear', async () => {
    it('can equally encode and decode inputs', async () => {
      const x = await loadFixture(utils.deployFixture)
      const bFactor = 0n
      const inputs: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish] = [
        -500n,
        0, 3n,
        0, 40n
      ]
      const xOverYPlusBEncoded = await x.stakeManager.encodeLinear(bFactor, ...inputs)
      await expect(x.stakeManager.decodeLinear(bFactor, xOverYPlusBEncoded.input))
        .eventually.to.deep.equal([inputs[2], inputs[4], inputs[0]])
    })
    it('adds a power factor with other inputs', async () => {
      const x = await loadFixture(utils.deployFixture)
      const bFactor = 3n
      const inputs: [bigint, bigint, bigint, bigint, bigint] = [
        -500n,
        2n, 3n,
        4n, 40n
      ]
      const xOverYPlusBEncoded = await x.stakeManager.encodeLinear(bFactor, ...inputs)
      await expect(x.stakeManager.decodeLinear(bFactor, xOverYPlusBEncoded.input))
        .eventually.to.deep.equal([
          inputs[2] * (2n**inputs[1]),
          inputs[4] * (2n**inputs[3]),
          inputs[0] * (2n**bFactor),
        ])
    })
  })
})
