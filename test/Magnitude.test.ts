import { loadFixture, setNextBlockBaseFeePerGas } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as utils from './utils'
import { IUnderlyingStakeable } from '../artifacts/types/contracts/interfaces/IHEX'

describe('Magnitude.sol', () => {
  const principle = hre.ethers.utils.parseUnits('100', 8).toBigInt()
  const tenPercentAsUint = (1_000n << 32n) | 10_000n
  const yieldFromPrinciple = principle*11n/10n
  const principleAndYield = principle+yieldFromPrinciple
  const minInt24 = 2n**23n // zero point for int24
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
      await expect(x.stakeManager.computeDayMagnitude(hre.ethers.constants.MaxUint256, 0, 100, 100, stake))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeDayMagnitude(hre.ethers.constants.MaxUint256, 1, 1001, 1002, stake))
        .eventually.to.equal(1001)
    })
    it('2: returns the staked days property', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeDayMagnitude(hre.ethers.constants.MaxUint256, 2, 0, 0, stake))
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
      await expect(x.stakeManager.computeDayMagnitude(hre.ethers.constants.MaxUint256, 3, 0, currentDay, stk))
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
      await expect(x.stakeManager.computeDayMagnitude(hre.ethers.constants.MaxUint256, 3, 0, currentDay, stk))
        .eventually.to.equal(6)
    })
  })
  describe('computeMagnitude', () => {
    it('0: always returns zero', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 0, 100, 100, stake))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 1, 1001, 1002, stake))
        .eventually.to.equal(1001)
    })
    it('2: returns a % of total', async () => {
      const x = await loadFixture(utils.deployFixture)
      // do not sub 1 from the x input - needed to ensure rounding correctly
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 2, tenPercentAsUint, 10_000_000, stake))
        .eventually.to.equal(1_000_000)
    })
    it('3: returns a % of principle', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 3, tenPercentAsUint, principleAndYield, stake))
        .eventually.to.equal(principle / 10n)
    })
    it('4: returns a % of yield', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 4, tenPercentAsUint, principleAndYield, stake))
        .eventually.to.equal(yieldFromPrinciple / 10n)
    })
    it('5: uses (x/y)+b as a further bitpacked value with total', async () => {
      const x = await loadFixture(utils.deployFixture)
      const xOverYPlusB = ( (minInt24 + -500n) << 32n ) | ( 3n << 16n ) | 40n; // -500 + (input * 3) / 40
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 5, xOverYPlusB, principleAndYield, stake))
        .eventually.to.equal(((principleAndYield * 3n) - 500n) / 40n)
    })
    it('6: uses (x/y)+b as a further bitpacked value with principle', async () => {
      const x = await loadFixture(utils.deployFixture)
      const xOverYPlusB = ( (minInt24 + -500n) << 32n ) | ( 3n << 16n ) | 40n; // -500 + (input * 3) / 40
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 6, xOverYPlusB, principleAndYield, stake))
        .eventually.to.equal(((principle * 3n) - 500n) / 40n)
    })
    it('7: uses (x/y)+b as a further bitpacked value with yield', async () => {
      const x = await loadFixture(utils.deployFixture)
      const xOverYPlusB = ( (minInt24 + -500n) << 32n ) | ( 3n << 16n ) | 40n; // -500 + (input * 3) / 40
      await expect(x.stakeManager.computeMagnitude(hre.ethers.constants.MaxUint256, 7, xOverYPlusB, principleAndYield, stake))
        .eventually.to.equal(((yieldFromPrinciple * 3n) - 500n) / 40n)
    })
  })
})