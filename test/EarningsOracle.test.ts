import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import type { ethers } from 'ethers'
import * as hre from 'hardhat'
import { expect } from "chai"
import * as utils from './utils'
import _ from 'lodash'

describe.only('EarningsOracle.sol', () => {
  const deployOracle = async (min: ethers.BigNumberish, untilDay: ethers.BigNumberish) => {
    const EarningsOracle = await hre.ethers.getContractFactory('EarningsOracle')
    const oracle = await EarningsOracle.deploy(min, untilDay)
    await oracle.deployed()
    return oracle
  }
  const launch = (untilDay: ethers.BigNumberish) =>
    async function launchEarningsOracle() {
      const oracle = await deployOracle(1, untilDay)
      const hex = await hre.ethers.getContractAt('IHEX', utils.hexAddress)
      return {
        hex,
        oracle,
      }
    }
  const launchZero = launch(0)
  const launchSome = launch(10)
  const launchMixup = () => deployOracle(0, 0)
  const launchUpTo = async (offset = 0n) => {
    const x = await launchZero()
    const _currentDay = await x.hex.currentDay()
    const currentDay = _currentDay.toBigInt()
    const maxDay = currentDay - offset
    while (true) {
      const currentSize = await x.oracle.payoutTotalSize()
      const startDay = currentSize.toBigInt()
      if (startDay > maxDay) {
        throw new Error('cannot set to current day or higher')
      }
      let needed = maxDay - startDay
      if (needed > 1_000n) {
        needed = 1_000n
      }
      if (needed > 0n) {
        await x.oracle.catchUpDays(needed)
      } else break;
    }
    return {
      ...x,
      currentDay,
    }
  }
  const launchCurrentSub1 = async () => launchUpTo(1n)
  const launchCurrent = async () => launchUpTo()
  describe('IHEX', () => {
    let x!: Awaited<ReturnType<typeof launchZero>>
    beforeEach(async () => {
      x = await loadFixture(launchZero)
    })
    describe('dailyData', () => {
      it('returns zero values when the day has not yet passed', async () => {
        const _currentDay = await x.hex.currentDay()
        const currentDay = _currentDay.toBigInt()
        const dailyDataTomorrow = await x.hex.dailyData(currentDay)
        expect(dailyDataTomorrow.dayPayoutTotal).to.equal(0n)
        expect(dailyDataTomorrow.dayStakeSharesTotal).to.equal(0n)
        expect(dailyDataTomorrow.dayUnclaimedSatoshisTotal).to.equal(0n)
      })
      it('returns nonzero values when the day has not yet passed but the lower bound has', async () => {
        const _currentDay = await x.hex.currentDay()
        const currentDay = _currentDay.toBigInt()
        const dailyDataTomorrow = await x.hex.dailyData(currentDay - 1n)
        expect(dailyDataTomorrow.dayPayoutTotal).to.be.greaterThan(0n)
        expect(dailyDataTomorrow.dayStakeSharesTotal).to.be.greaterThan(0n)
        expect(dailyDataTomorrow.dayUnclaimedSatoshisTotal).to.be.greaterThan(0n)
      })
    })
  })
  describe('incorrect setup', () => {
    let oracle!: Awaited<ReturnType<typeof deployOracle>>
    beforeEach(async () => {
      oracle = await loadFixture(launchMixup)
    })
    describe('storeDay', () => {
      it('will fail on second day (1) storeage', async () => {
        await oracle.storeDay(0)
        await expect(oracle.storeDay(1))
          .to.revertedWithCustomError(oracle, 'NotAllowed')
      })
    })
  })
  describe('stored with no info', () => {
    let x!: Awaited<ReturnType<typeof launchZero>>
    beforeEach(async () => {
      x = await loadFixture(launchZero)
    })
    describe('payoutTotalSize', () => {
      it('launches with 0 read items', async () => {
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(0)
      })
      it('returns a number commenserate with the amount of days that have been read', async () => {
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(4)
      })
    })
    describe('storeDay', () => {
      it('requires the next available day', async () => {
        await expect(x.oracle.storeDay(1))
          .to.revertedWithCustomError(x.oracle, 'NotAllowed')
        const currentSize = await x.oracle.payoutTotalSize()
        await x.oracle.storeDay(currentSize)
        await expect(x.oracle.storeDay(currentSize))
          .to.revertedWithCustomError(x.oracle, 'NotAllowed')
        await x.oracle.storeDay(currentSize.toBigInt() + 1n)
      })
    })
    describe('incrementDay', () => {
      it('increases the day', async () => {
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(4)
      })
    })
  })
  describe('from some data pulled over', () => {
    let x!: Awaited<ReturnType<typeof launchSome>>
    beforeEach(async () => {
      x = await loadFixture(launchSome)
    })
    describe('payoutDelta', () => {
      it('provides the amount of tokens paid out during that time in an accumulative number', async () => {
        const split = 6
        const size = await x.oracle.payoutTotalSize()
        const end = size.toBigInt() - 1n
        const zeroToSplit = await x.oracle.payoutDelta(0, split)
        const splitToEnd = await x.oracle.payoutDelta(split, end)
        await expect(x.oracle.payoutDelta(0, end))
          .eventually.to.equal(zeroToSplit.toBigInt() + splitToEnd.toBigInt())
      })
      it('fails if an out of bounds value is provided', async () => {
        const size = await x.oracle.payoutTotalSize()
        await expect(x.oracle.payoutDelta(0, size))
          .to.revertedWithPanic()
      })
    })
    describe('incrementDay', () => {
      it('increases the day by 1', async () => {
        const size = await x.oracle.payoutTotalSize()
        await x.oracle.incrementDay()
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(size.toBigInt() + 1n)
      })
    })
    describe('storeDays', () => {
      it('stores a range of days', async () => {
        const previousSize = await x.oracle.payoutTotalSize()
        const startDay = previousSize.toBigInt()
        const rangeSize = 10n
        await x.oracle.storeDays(startDay, startDay + rangeSize)
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(startDay + rangeSize)
      })
    })
    describe('catchUpDays', () => {
      it('catches up a limited number of days without relying on knowing the start / end days', async () => {
        const previousSize = await x.oracle.payoutTotalSize()
        const rangeSize = 10n
        await x.oracle.catchUpDays(rangeSize)
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(previousSize.toBigInt() + rangeSize)
      })
    })
  })
  describe('has almost all current data pulled over', () => {
    let x!: Awaited<ReturnType<typeof launchCurrentSub1>>
    beforeEach(async function () {
      this.timeout(120_000)
      x = await loadFixture(launchCurrentSub1)
    })
    describe('catchUpDays', () => {
      it('is clamped by the current day', async () => {
        const _currentSize = await x.oracle.payoutTotalSize()
        const currentSize = _currentSize.toBigInt()
        await x.oracle.catchUpDays(5000n)
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(x.currentDay)
        expect(x.currentDay - currentSize).to.be.lessThan(5n)
        // dealing in indexes again
        await expect(x.oracle.payoutTotal(x.currentDay - 1n))
          .eventually.not.to.equal(await x.oracle.payoutTotal(x.currentDay - 2n))
      })
    })
    describe('incrementDay', () => {
      it('is clamped by the current day', async () => {
        const _size = await x.oracle.payoutTotalSize()
        let size = _size.toBigInt()
        await x.oracle.incrementDay()
        ++size
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(size)
        await x.oracle.incrementDay()
        // no data collected
        await expect(x.oracle.payoutTotalSize())
          .eventually.to.equal(size)
      })
    })
  })
  // describe('has all current data pulled over', () => {
  //   let x!: Awaited<ReturnType<typeof launchCurrent>>
  //   beforeEach(async function () {
  //     this.timeout(120_000)
  //     x = await loadFixture(launchCurrent)
  //   })
  //   describe('incrementDay', () => {
  //     it('is clamped by the current day', async () => {
  //       const size = await x.oracle.payoutTotalSize()
  //       await x.oracle.incrementDay() // just does nothing
  //       await expect(x.oracle.payoutTotalSize())
  //         .eventually.to.equal(size)
  //     })
  //   })
  // })
})
