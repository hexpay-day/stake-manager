import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import type { ethers } from 'ethers'
import * as hre from 'hardhat'
import { expect } from "chai"
import * as utils from './utils'
import * as config from '../src/config'
import _ from 'lodash'
import { IHEX } from "../artifacts/types"

describe('EarningsOracle.sol', () => {
  const deployOracle = async (min: ethers.BigNumberish, untilDay: ethers.BigNumberish) => {
    const EarningsOracle = await hre.ethers.getContractFactory('EarningsOracle')
    const oracle = await EarningsOracle.deploy(min, untilDay)
    await oracle.deployed()
    return oracle
  }
  const launch = (untilDay: ethers.BigNumberish) =>
    async function launchEarningsOracle() {
      const oracle = await deployOracle(1, untilDay)
      const hex = await hre.ethers.getContractAt('contracts/interfaces/IHEX.sol:IHEX', utils.hexAddress) as IHEX
      return {
        hex,
        oracle,
      }
    }
  const launchZero = launch(0)
  const launchSome = launch(10)
  const launchFull = launch(1_000)
  const launchMixup = () => deployOracle(0, 0)
  const launchUpTo = async (offset = 0n) => {
    const x = await launchZero()
    const _currentDay = await x.hex.currentDay()
    const currentDay = _currentDay.toBigInt()
    const maxDay = currentDay - offset
    while (true) {
      const currentSize = await x.oracle.totalsCount()
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
  // const launchCurrent = async () => launchUpTo()
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
        if (dailyDataTomorrow.dayPayoutTotal.toBigInt() === 0n) {
        }
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
    describe('totalsCount', () => {
      it('launches with 0 read items', async () => {
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(0)
      })
      it('returns a number commenserate with the amount of days that have been read', async () => {
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await x.oracle.incrementDay()
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(4)
      })
    })
    describe('storeDay', () => {
      it('requires the next available day', async () => {
        await expect(x.oracle.storeDay(1))
          .to.revertedWithCustomError(x.oracle, 'NotAllowed')
        const currentSize = await x.oracle.totalsCount()
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
        await expect(x.oracle.totalsCount())
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
        const size = await x.oracle.totalsCount()
        const end = size.toBigInt() - 1n
        const zeroToSplit = await x.oracle.payoutDelta(0, split)
        const splitToEnd = await x.oracle.payoutDelta(split, end)
        const all = await x.oracle.payoutDelta(0, end)
        expect(all.payout).to.equal(zeroToSplit.payout.toBigInt() + splitToEnd.payout.toBigInt())
        expect(all.shares).to.equal(zeroToSplit.shares.toBigInt() + splitToEnd.shares.toBigInt())
      })
      it('fails if an out of bounds value is provided', async () => {
        const size = await x.oracle.totalsCount()
        await expect(x.oracle.payoutDelta(0, size))
          .to.revertedWithPanic()
      })
    })
    describe('incrementDay', () => {
      it('increases the day by 1', async () => {
        const size = await x.oracle.totalsCount()
        await x.oracle.incrementDay()
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(size.toBigInt() + 1n)
      })
    })
    describe('storeDays', () => {
      it('stores a range of days', async () => {
        const previousSize = await x.oracle.totalsCount()
        const startDay = previousSize.toBigInt()
        const rangeSize = 10n
        await x.oracle.storeDays(startDay, startDay + rangeSize)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(startDay + rangeSize)
      })
      it('if start day does not match, failure', async () => {
        const previousSize = await x.oracle.totalsCount()
        const startDay = previousSize.toBigInt()
        const rangeSize = 10n
        await x.oracle.storeDays(startDay, startDay + rangeSize)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(startDay + rangeSize)
      })
      it('if start day does not match, failure', async () => {
        const previousSize = await x.oracle.totalsCount()
        const startDay = previousSize.toBigInt()
        const rangeSize = 10n
        await x.oracle.storeDays(startDay + 1n, startDay + rangeSize)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(startDay + rangeSize)
      })
      it('if size is greater than until day, collect no data', async () => {
        await x.oracle.storeDays(3, 8)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(10)
      })
      it('collects until the provided day', async () => {
        const previousSize = await x.oracle.totalsCount()
        const startDay = previousSize.toBigInt()
        const rangeSize = 10n
        await x.oracle.storeDays(0, startDay + rangeSize)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(startDay + rangeSize)
      })
      it('does not collect if the requisite day has passed', async () => {
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(10)
        await x.oracle.storeDays(0, 8)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(10)
      })
    })
    describe('catchUpDays', () => {
      it('catches up a limited number of days without relying on knowing the start / end days', async () => {
        const previousSize = await x.oracle.totalsCount()
        const rangeSize = 10n
        await x.oracle.catchUpDays(rangeSize)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(previousSize.toBigInt() + rangeSize)
      })
      it('maxes out at the max catch up days', async function () {
        const max = await x.oracle.MAX_CATCH_UP_DAYS()
        const previousSize = await x.oracle.totalsCount()
        await x.oracle.catchUpDays(max.toBigInt() + 100n)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(previousSize.toBigInt() + max.toBigInt())
      })
      it('uses the max days if zero is provided', async function () {
        const max = await x.oracle.MAX_CATCH_UP_DAYS()
        const previousSize = await x.oracle.totalsCount()
        await x.oracle.catchUpDays(0)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(previousSize.toBigInt() + max.toBigInt())
      })
    })
    describe.only('payoutDeltaTruncated', () => {
      let x!: Awaited<ReturnType<typeof launchFull>>
      beforeEach(async () => {
        x = await loadFixture(launchFull)
      })
      it.only('gives a minimum value that should have been claimable by the range for a given magnitude', async function () {
        const rangeFrom = (startFrom: bigint, startTo: bigint) => (new Array(Number(startTo - startFrom))).fill(startFrom).map((a, index) => a + BigInt(index) as bigint)
        const logValues = async (startFrom: bigint, startTo: bigint, days: bigint) => {
          const range = rangeFrom(startFrom, startTo + 1n)
          for (let i = 0; i < range.length; i++) {
            const a = range[i]
            const b = a + days
            console.log(a, b, (await x.oracle.payoutDeltaTruncated(a, days, shares)).toBigInt())
          }
        }
        const checkDay = async (txHash: string, startDay: bigint) => {
          const tx = await hre.ethers.provider.getTransactionReceipt(txHash)
          await expect(x.hex.callStatic.currentDay({
            blockTag: `0x${tx.blockNumber.toString(16)}`
          }))
            .eventually.to.equal(startDay)
          console.log('tx hash %o started on day %o', txHash, startDay)
        }
        const hexBruteCalc = async (shares: bigint, lockedDay: bigint, stakedDays: bigint) => {
          const range = rangeFrom(lockedDay, lockedDay + stakedDays)
          const hexDays = await Promise.all(range.map((day) => x.hex.dailyData(day)))
          const payout = hexDays.reduce((total, day) => total + ((day.dayPayoutTotal.toBigInt() * shares) / day.dayStakeSharesTotal.toBigInt()), 0n)
          return payout
        }
        const estimate = async (args: {
          lockedDay: bigint;
          stakedDays: bigint;
          shares: bigint;
          // payout: bigint;
          delta: bigint;
        }) => {
          const {
            lockedDay,
            stakedDays,
            shares,
            delta,
          } = args
          const payout = await hexBruteCalc(shares, lockedDay, stakedDays)
          const estimated = await x.oracle.payoutDeltaTruncated(lockedDay, stakedDays, shares)
          const est = estimated.toBigInt()
          await expect(x.oracle.payoutDeltaTruncated(lockedDay, stakedDays, shares))
            .eventually.to.be.approximately(Number(payout), Number(delta))
          const d = payout - est
          const absDelta = d < 0 ? -d : d
          console.table({
            lockedDay,
            stakedDays,
            shares,
            payout,
            estimated: est,
            delta: d,
            expected: delta,
            percentOff: `${(Number(absDelta) / Number(payout)) * 100}%`,
          })
        }
        let shares!: bigint
        let stakedDays!: bigint
        let startDay!: bigint
        let lockedDay!: bigint

        // #405414
        shares = 1_912_952_383_283n
        stakedDays = 8n
        startDay = 599n
        lockedDay = startDay + 1n
        // await logValues(lowerStart, upperStart, stakedDays)
        await checkDay('0x444c0ab9297db72e641bcec6cb83c08f5b1792a7c9b7636299bdb0e15dd5c428', startDay)
        await estimate({
          lockedDay, stakedDays, shares,
          delta: 23_296n,
        })

        // #405391
        shares = 25_328_837_913_105n
        stakedDays = 38n
        startDay = 599n
        lockedDay = startDay + 1n
        // await logValues(lowerStart, upperStart, stakedDays)
        await checkDay('0x6118e367cd86946a016714494764f019233d299ee82119692baf8ee519b6ba93', startDay)
        await estimate({
          lockedDay, stakedDays, shares,
          delta: 6_697_847n,
        })

        // #405076
        shares = 231_641_365_924n
        stakedDays = 368n
        startDay = 599n
        lockedDay = startDay + 1n
        // await logValues(lowerStart, upperStart, stakedDays)
        await checkDay('0xb0a8a10e708d49f30c3b3158fc89900e1720f4d6a7a389a17af1ba8eb5b0fad2', startDay)
        await estimate({
          lockedDay, stakedDays, shares,
          delta: 19_271_067n,
        })

        // #404922
        shares = 13_119_795_936_958n
        stakedDays = 365n
        startDay = 599n
        lockedDay = startDay + 1n
        // await logValues(lowerStart, upperStart, stakedDays)
        await checkDay('0x54bea2e3218142377bce69a00c106e1e9452ddd6710a2efb79a88d11e35a35ef', startDay)
        await estimate({
          lockedDay, stakedDays, shares,
          delta: 1_087_011_851n,
        })
      })
      it('will give the same value if the total shares are passed and only 1 days is asked for', async () => {
        const day0 = await x.oracle.totals(998) // zero day
        const day1 = await x.oracle.totals(999)
        const deltaShares = day1.shares.toBigInt() - day0.shares.toBigInt()
        const deltaPayout = day1.payout.toBigInt() - day0.payout.toBigInt()
        await expect(x.oracle.payoutDeltaTruncated(999, 1, deltaShares))
          .eventually.to.equal(deltaPayout)
      })
      it('will give very close to the same value if the total shares are passed', async () => {
        const lockedDay = 900n
        const stakedDays = 10n
        const range = _.range(Number(lockedDay), Number(lockedDay + stakedDays)) // 900-909
        expect(range.length).to.equal(stakedDays)
        const neededDays = [Number(lockedDay - 1n)].concat(range)
        const days = await Promise.all(neededDays.map((day) => x.oracle.totals(day)))
        const hexDays = await Promise.all(range.map((day) => x.hex.dailyData(day)))
        const hexDayData = hexDays.map((day) => ([
          day.dayStakeSharesTotal.toBigInt(),
          day.dayPayoutTotal.toBigInt(),
        ]))
        const contractDayData = days.reduce((list, day, index) => {
          if (!index) return list
          const previous = days[index - 1]
          return list.concat([
            [
              day.shares.toBigInt() - previous.shares.toBigInt(),
              day.payout.toBigInt() - previous.payout.toBigInt(),
            ],
          ])
        }, [] as [bigint, bigint][])
        expect(contractDayData).to.deep.equal(hexDayData)
        const added = {
          shares: _(contractDayData).map('0').reduce((t, a) => t + a, 0n),
          payout: _(contractDayData).map('1').reduce((t, a) => t + a, 0n),
        }
        const rangeDelta = BigInt(range.length)
        await expect(x.oracle.payoutDeltaTruncated(lockedDay, stakedDays, added.shares))
          .eventually.to.equal((added.payout * rangeDelta) - (rangeDelta - 1n))
        expect(hexDays.reduce((total, day) => total + day.dayPayoutTotal.toBigInt(), 0n))
          .to.equal(added.payout)
      })
    })
  })
  describe('has almost all current data pulled over', () => {
    let x!: Awaited<ReturnType<typeof launchCurrentSub1>>
    beforeEach(async function () {
      x = await loadFixture(launchCurrentSub1)
    })
    describe('catchUpDays', () => {
      it('is clamped by the current day', async () => {
        const _currentSize = await x.oracle.totalsCount()
        const currentSize = _currentSize.toBigInt()
        await x.oracle.catchUpDays(5000n)
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(x.currentDay)
        expect(x.currentDay - currentSize).to.be.lessThan(5n)
        // dealing in indexes again
        await expect(x.oracle.totals(x.currentDay - 1n))
          .eventually.not.to.equal(await x.oracle.totals(x.currentDay - 2n))
      })
    })
    describe('incrementDay', () => {
      it('is clamped by the current day', async () => {
        const _size = await x.oracle.totalsCount()
        let size = _size.toBigInt()
        await x.oracle.incrementDay()
        ++size
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(size)
        await x.oracle.incrementDay()
        // no data collected
        await expect(x.oracle.totalsCount())
          .eventually.to.equal(size)
      })
    })
  })
})
