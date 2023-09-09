import { loadFixture, setNextBlockBaseFeePerGas, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as withArgs from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import * as utils from './utils'
import { EncodableSettings } from "../artifacts/types"

describe("StakeManager", function () {
  describe('UnderlyingStakeable', () => {
    it('should count its stakes', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.stakeCount(x.stakeManager.address))
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer1).stakeStart(x.stakedAmount, 10)
      await expect(x.stakeManager.stakeCount(x.stakeManager.address))
        .eventually.to.equal(1)
    })
  })

  describe('encodeSettings/decodeSettings', () => {
    it('encodes and decodes settings', async () => {
      const x = await loadFixture(utils.deployFixture)
      const defaultEncoded = await x.stakeManager.defaultEncodedSettings()
      const defaultDecoded = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.encodeSettings(defaultDecoded))
        .eventually.to.equal(defaultEncoded)
      await expect(x.stakeManager.decodeSettings(defaultEncoded))
        .eventually.to.be.deep.equal(defaultDecoded)
    })
  })
  describe('encodeTipSettings/decodeTipSettings', () => {
    it('fails if 0 is provided as a denominator and numerator is non zero', async () => {
      const x = await loadFixture(utils.deployFixture)
      const encodedLinear = await x.stakeManager.encodeLinear({
        method: 0,
        xFactor: 1,
        x: 1,
        yFactor: 0,
        y: 1,
        bFactor: 0,
        b: 0,
      })
      await expect(x.stakeManager.encodeTipSettings(
        false,
        0,
        x.oneEther,
        encodedLinear
      )).not.to.reverted
      const encodedLinearFailure = await x.stakeManager.encodeLinear({
        method: 0,
        xFactor: 1,
        x: 1,
        yFactor: 0,
        y: 0,
        bFactor: 0,
        b: 0,
      })
      await expect(x.stakeManager.encodeTipSettings(
        false,
        0,
        x.oneEther,
        BigInt.asUintN(64, encodedLinearFailure.toBigInt())
      )).to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
  })
  describe('stakeable', () => {
    it('can get the stake list', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 10)
      const stake = await x.stakeManager.stakeLists(x.stakeManager.address, 0)
      expect(stake.stakeId).to.equal(x.nextStakeId)
      expect(stake.stakedHearts).to.equal(x.stakedAmount)
      expect(stake.stakedDays).to.equal(10)
      expect(stake.lockedDay).to.equal((await x.hex.currentDay()).toBigInt() + 1n)
      expect(stake.unlockedDay).to.equal(0)
      expect(stake.isAutoStake).to.be.false
    })
    it('proxies to hex for the current day', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.hex.currentDay())
        .eventually.to.equal(await x.stakeManager.currentDay())
    })
    it('proxies to hex for global info', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.hex.globalInfo())
        .eventually.to.deep.equal(await x.stakeManager.globalInfo())
    })
    it('has a utility for checking if the stake is ending', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 10)
      const stake = await x.stakeManager.stakeLists(x.stakeManager.address, 0)
      await expect(x.stakeManager.isEarlyEnding(stake.lockedDay, stake.stakedDays, await x.hex.currentDay()))
        .eventually.to.be.true
      await utils.moveForwardDays(5, x)
      await expect(x.stakeManager.isEarlyEnding(stake.lockedDay, stake.stakedDays, await x.hex.currentDay()))
        .eventually.to.be.true
      await utils.moveForwardDays(6, x)
      await expect(x.stakeManager.isEarlyEnding(stake.lockedDay, stake.stakedDays, await x.hex.currentDay()))
        .eventually.to.be.false
    })
  })
  describe("withdrawals", () => {
    it("should not allow too much to be withdrawn", async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.hex.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositToken(x.hex.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.connect(signer3).withdrawTokenTo(x.hex.address, signer1.address, 1))
        .not.to.reverted
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(x.hex.address, signer1.address, 1n + x.oneMillion))
        .not.to.reverted
    })
    it('should allow the contract to define how much to withdraw', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.hex.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositTokenTo(x.hex.address, signer1.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer1).withdrawTokenTo(x.hex.address, signer1.address, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.oneMillion * 2n)
    })
    it('fails if 0 is passed as amount', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.depositToken(x.hex.address, 0))
        .not.to.emit(x.hex, 'Transfer')
        .not.to.reverted
    })
  })
  describe('depositing tokens', async () => {
    it('can transfer tokens from sender to contract', async function() {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.hex.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.attributed(x.hex.address))
        .eventually.to.equal(x.oneMillion)
    })
    it('can deposit tokens and not attribute them to self', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositTokenUnattributed(x.hex.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.attributed(x.hex.address))
        .eventually.to.equal(0)
    })
  })
  describe('stake starts', () => {
    it('can only be initiated from the owning address', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).stakeStart(x.oneMillion, 10))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.oneMillion)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(() => true, x.stakeManager.address, x.nextStakeId)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
    })
    it('multiple can be started in the same tx by the ender at the direction of the owner', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
    })
  })
  describe('same day stakeEnd', () => {
    it('ends a stake and returns tokens', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.stakeStart(x.stakedAmount, 10))
        .to.emit(x.hex, 'StakeStart')
      // end stake in same day
      const stakeIndex = await x.stakeManager.stakeIdToIndex(x.nextStakeId)
      await expect(x.stakeManager.stakeEnd(stakeIndex, x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, x.signers[0].address, x.stakedAmount)
    })
  })
  describe('stakeEnd', () => {
    it('ends a stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 3)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.stakeEnd(0, x.nextStakeId + 1n))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
    })
    it('multiple can be ended and restarted in the same transaction', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false)

      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId + 1n))
        .eventually.to.equal(signer1.address)

      await utils.moveForwardDays(11, x)
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEnd', [0, x.nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyValue, withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n + 11n)
    })
  })
  describe('stakeEndById', () => {
    it('fails if no stake id found', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 3)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.stakeEndById(x.nextStakeId + 1n))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
    })
    it('ends a stake without an index', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 3)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.stakeEndById(x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId)
    })
  })
  describe('stakeEndByConsent', () => {
    it('can start stakes and end them - all managed by a single contract', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 369
      const half1 = Math.floor(days / 2)
      const half2 = days - half1
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, half1, defaultSettings]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, days, defaultSettings]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, half1, defaultSettings]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, days, defaultSettings]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(x.stakeManager.connect(signer3).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, half1, defaultSettings]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, days, defaultSettings]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 5n)
      // all 4 stakes are applied to the single manager (optimized)
      await expect(x.hex.stakeCount(x.stakeManager.address))
        .eventually.to.equal(6)
      await utils.moveForwardDays(half1 + 1, x)
      await expect(x.stakeManager.connect(signer4).multicall([
        x.StakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 4n,
        ]),
        x.StakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 2n,
        ]),
        x.StakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 0n,
        ]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 0n)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
        // .printGasUsage()
      await utils.moveForwardDays(half2, x)
      const originAddress = '0x9A6a414D6F3497c05E3b1De90520765fA1E07c03'
      const tx = x.stakeManager.connect(signer4).stakeEndByConsentForMany([
        x.nextStakeId + 5n,
        x.nextStakeId + 3n,
        x.nextStakeId + 1n,
      ])
      await expect(tx)
        .to.changeTokenBalances(x.hex,
          [signer1, originAddress],
          [0, 0],
        )
        // .printGasUsage()
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 5n)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(tx)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(tx)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
      await expect(x.hex.stakeCount(x.stakeManager.address)).eventually.to.equal(6)
    })
  })
  describe('stakeRestartById', () => {
    it('runs a permissioned, gas optimized, restart of a stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      const days = 3
      // gives no consent for non owner to end
      await x.stakeManager.stakeStart(x.stakedAmount, days)
      await utils.moveForwardDays(days + 1, x)
      await expect(x.stakeManager.connect(signer2).stakeRestartById(x.nextStakeId))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.stakeManager.stakeRestartById(x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
    })
  })
  describe('stakeRestartManyById', () => {
    it('runs a permissioned, gas optimized, restart of a stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      const days = 3
      // gives no consent for non owner to end
      await x.stakeManager.stakeStart(x.stakedAmount, days)
      await x.stakeManager.stakeStart(x.stakedAmount, days)
      await utils.moveForwardDays(days + 1, x)
      await expect(x.stakeManager.connect(signer2).stakeRestartManyById([x.nextStakeId, x.nextStakeId + 1n]))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.stakeManager.stakeRestartManyById([x.nextStakeId, x.nextStakeId + 1n]))
        .to.emit(x.hex, 'StakeEnd')
    })
  })
  describe('withdrawal at end of stake', () => {
    it('transfers tokens to staker at end', async () => {
      const x = await loadFixture(utils.deployFixture)
      const days = 3
      const [signer1, signer2] = x.signers

      const settings = await x.stakeManager.defaultSettings()
      const updatedSettingsWithTransfer: EncodableSettings.SettingsStruct = {
        ...settings,
        newStakeDaysMethod: 0,
        copyIterations: 0,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('11101', 2)),
      }
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        newStakeDaysMethod: 0,
        copyIterations: 0,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('01101', 2)),
      }
      const encodedSettingsWithTransfer = await x.stakeManager.encodeSettings(updatedSettingsWithTransfer)
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettingsWithTransfer)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings)
      await utils.moveForwardDays(days + 1, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([x.nextStakeId]))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, withArgs.anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, withArgs.anyUint)
        // .printGasUsage()
      const balanceBefore = await x.hex.balanceOf(signer1.address)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([x.nextStakeId + 1n]))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.hex.balanceOf(signer1.address))
        .eventually.to.equal(balanceBefore)
    })
  })
  const zeroLinear = {
    method: 0,
    xFactor: 0,
    x: 0,
    yFactor: 0,
    y: 0,
    bFactor: 0,
    b: 0,
  }
  describe('stakeEndByConsentForMany', () => {
    const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
    it('custodies funds if told to do nothing with them afterward', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      const days = 3
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
      await utils.moveForwardDays(4, x)
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings = {
        ...settings,
        newStake: zeroLinear,
      }
      await x.stakeManager.updateSettings(x.nextStakeId, updatedSettings)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.be.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([x.nextStakeId]))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.be.greaterThan(0)
    })
    it('tips during many ending', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      const days = 3
      const defaultSettings = await x.stakeManager.defaultSettings()
      const magnitudeA = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      const magnitudeB = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      const updatedSettingsA = await x.stakeManager.encodeSettings({
        ...defaultSettings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: magnitudeA,
        },
      })
      const updatedSettingsB = await x.stakeManager.encodeSettings({
        ...defaultSettings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: magnitudeB,
        },
      })
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, updatedSettingsA))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, updatedSettingsB))
        .to.emit(x.hex, 'StakeStart')
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer3.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForManyWithTipTo([x.nextStakeId, x.nextStakeId + 1n], signer3.address))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer3.address))
        .eventually.to.equal(magnitudeA + magnitudeB)
    })
    it('counts down end stakes if < 255', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 3
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
      const settings = await x.stakeManager.defaultSettings()
      let updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        copyIterations: 1,
      }
      await x.stakeManager.updateSettings(x.nextStakeId, updatedSettings)
      await utils.moveForwardDays(4, x)
      let lastStakeId = x.nextStakeId
      let nextStakeId = await utils.nextStakeId(x.hex)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([lastStakeId]))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.be.equal(0)
      await utils.moveForwardDays(4, x)
      lastStakeId = nextStakeId
      nextStakeId = await utils.nextStakeId(x.hex)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([lastStakeId]))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.be.equal(0)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([nextStakeId]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyValue, withArgs.anyValue, x.stakeManager.address, nextStakeId)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.be.greaterThan(0)
    })
    it('cannot update settings unless signer is staker', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: {
          ...zeroLinear,
          method: 2,
          y: oneHundredHex,
        },
      }
      await expect(x.stakeManager.connect(signer2).updateSettings(nextStakeId, updatedSettings))
        .revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
    })
    it('allows staker to leave a tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHex,
        },
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      // this is an underestimation since yield is also a factor in this case
      const endStakeAndCollect = x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          x.hex.address,
          true,
          signer2.address,
          0,
        ]),
      ], false)
      await expect(endStakeAndCollect)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer2.address, oneHundredHex)
        // restart the stake
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
      await expect(endStakeAndCollect)
        .to.changeTokenBalances(x.hex,
          [signer2],
          [oneHundredHex],
        )
      await expect(x.stakeManager.collectUnattributed(x.hex.address, true, signer2.address, 0))
        .not.to.rejected
    })
    it('can handle a curve that results in zero tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...defaultSettings,
        targetTip: {
          method: 2,
          xFactor: 1,
          x: -1n,
          yFactor: 0,
          y: 1n,
          bFactor: 0,
          b: 10_000n
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings)
      await utils.moveForwardDays(11, x)
      // this is an underestimation since yield is also a factor in this case
      const endStakeAndCollect = x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          x.hex.address,
          true,
          signer2.address,
          0,
        ]),
      ], false)
      await expect(endStakeAndCollect)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        // restart the stake
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
    })
    it('can handle a curve that results in zero new stake amount', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...defaultSettings,
        newStake: {
          method: 2,
          xFactor: 1,
          x: -1n,
          yFactor: 0,
          y: 1,
          bFactor: 0,
          b: 10_000n,
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings)
      await utils.moveForwardDays(11, x)
      // this is an underestimation since yield is also a factor in this case
      const endStakeAndCollect = x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          x.hex.address,
          true,
          signer2.address,
          0,
        ]),
      ], false)
      await expect(endStakeAndCollect)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
    })
    it('can leave the tip in the withdrawable mapping', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHex,
        },
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributedPercent', [
          x.hex.address,
          false,
          signer2.address,
          500,
        ]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          x.hex.address,
          false,
          signer2.address,
          0,
        ]),
      ], false)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(x.hex.address, signer2.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer2.address, oneHundredHex)
    })
    it('leaves a tip for the ender', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(days + 1, x)
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0, {
        value: tipAmount,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tipAmount * -1n, tipAmount],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeIdTips(nextStakeId, 0))
        .eventually.to.equal(BigInt.asUintN(128, tipAmount << 72n))
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          hre.ethers.constants.AddressZero,
          false,
          signer2.address,
          0,
        ]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(tipAmount)
    })
    it('allows for a basefee multiplier to be applied', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(days + 1, x)
      const tipAmount = oneEther / 100n
      const encodedLinear = await x.stakeManager.encodeLinear({
        method: 1,
        xFactor: 1,
        x: 360,
        yFactor: 0,
        y: 7,
        bFactor: 0,
        b: 0,
      })
      const encodedSettings = await x.stakeManager.encodeTipSettings(false, 0, tipAmount, encodedLinear)
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero,nextStakeId, tipAmount, encodedLinear, {
        value: tipAmount,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tipAmount * -1n, tipAmount],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeIdTips(nextStakeId, 0))
        .eventually.to.equal(encodedSettings)
      await setNextBlockBaseFeePerGas(10n**6n)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributedPercent', [
          hre.ethers.constants.AddressZero,
          false,
          signer2.address,
          500,
        ]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          hre.ethers.constants.AddressZero,
          false,
          signer2.address,
          0,
        ]),
      ], false, {
        maxFeePerGas: 10n**6n,
      }))
        .to.emit(x.hex, 'StakeEnd')
      const latestBlock = await hre.ethers.provider.getBlock('latest')
      const basefee = latestBlock.baseFeePerGas?.toBigInt() as bigint
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(basefee * 360n / 7n)
    })
    it('unattributed can be withdrawn', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(days + 1, x)
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0, {
        value: tipAmount,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tipAmount * -1n, tipAmount],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeIdTips(nextStakeId, 0))
        .eventually.to.equal(BigInt.asUintN(128, tipAmount << 72n))
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          hre.ethers.constants.AddressZero,
          true,
          signer2.address,
          0,
        ]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer2],
          [tipAmount * -1n, tipAmount],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(0)
    })
    it('tracks unattributed through a global var', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.getUnattributed(hre.ethers.constants.AddressZero))
        .eventually.to.equal(0)
      await x.signers[0].sendTransaction({
        value: oneEther,
        to: x.stakeManager.address,
      })
      await expect(x.stakeManager.getUnattributed(hre.ethers.constants.AddressZero))
        .eventually.to.equal(oneEther)
    })
    it('if own stake is ended, tips go back to staker', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await x.stakeManager.removeTipsFromStake(nextStakeId, [0])
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(oneEther)
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
    })
    it('if stake is ended, tips can be attributed to account', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettingsEncoded = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettingsEncoded)
      await utils.moveForwardDays(days + 1, x)
      const tipAmount = oneEther / 100n
      const { AddressZero } = hre.ethers.constants
      await expect(x.stakeManager.depositAndAddTipToStake(false, AddressZero, nextStakeId, tipAmount, 0, {
        value: tipAmount,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tipAmount * -1n, tipAmount],
        )
      await expect(x.stakeManager.stakeEndByConsentWithTipTo(
        nextStakeId,
        signer2.address,
      ))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.stakeManager, 'Tip')
        .withArgs(
          x.nextStakeId,
          AddressZero,
          signer2.address,
          tipAmount,
        )
    })
    it('can remove singular tips', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const [signer1, signer2] = x.signers
      const days = 10
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(3, x)
      const tipAmount = oneEther / 100n
      const etherAddress = hre.ethers.constants.AddressZero
      await expect(x.stakeManager.depositAndAddTipToStake(false, etherAddress, nextStakeId, tipAmount, 0, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(etherAddress, signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await x.stakeManager.addTipToStake(false, etherAddress, nextStakeId, tipAmount, 0)
      await x.stakeManager.addTipToStake(false, etherAddress, nextStakeId, tipAmount, 0)
      await x.stakeManager.addTipToStake(false, etherAddress, nextStakeId, tipAmount, 0)
      await x.stakeManager.addTipToStake(false, etherAddress, nextStakeId, tipAmount, 0)
      await expect(x.stakeManager.withdrawableBalanceOf(etherAddress, signer1.address))
        .eventually.to.equal(oneEther - (5n * tipAmount))
      // 5 tips, each with 0.01 ether
      await expect(x.stakeManager.removeTipsFromStake(nextStakeId, [3, 1]))
        .to.emit(x.stakeManager, 'RemoveTip')
      await expect(x.stakeManager.withdrawableBalanceOf(etherAddress, signer1.address))
        .eventually.to.equal(oneEther - (3n * tipAmount))
    })
    it('if own stake is ended, cannot add to tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, days * 2, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0, {
        value: tipAmount,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tipAmount * -1n, tipAmount],
        )
      const encodedLinear = await x.stakeManager.encodeLinear({
        ...zeroLinear,
        xFactor: 1,
        x: 1,
        y: 1,
      })
      await expect(x.stakeManager.connect(signer2).depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, 0, encodedLinear))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeIdTipSize(nextStakeId))
        .eventually.to.equal(1)
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, 0, encodedLinear))
        .not.to.emit(x.stakeManager, 'AddTip')
      await expect(x.stakeManager.stakeIdTipSize(nextStakeId))
        .eventually.to.equal(1)
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(0)
      await x.stakeManager.removeTipsFromStake(nextStakeId, [0])
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(tipAmount)
      await expect(x.stakeManager.addTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
    it('can withdraw from balance at any time', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      const tenthEther = oneEther / 10n
      await expect(x.stakeManager.depositToken(hre.ethers.constants.AddressZero, oneEther - 2n, {
        value: oneEther - 2n,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [(oneEther - 2n) * -1n, (oneEther - 2n)],
        )
      let expectedBalance = oneEther - 2n // 99999999999999998
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.connect(signer2).depositTokenTo(hre.ethers.constants.AddressZero, signer1.address, 1, {
        value: 1n,
      }))
      .to.changeEtherBalances(
        [signer2, x.stakeManager],
        [-1n, 1n],
      )
      // expectedBalance += 1n // 99999999999999998
      await expect(x.stakeManager.depositAndAddTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tipAmount, 0, {
        value: tipAmount - 1n,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [-(tipAmount - 1n), tipAmount - 1n],
        )
      // 99999999999999999
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.connect(signer2).removeTipsFromStake(nextStakeId, [0]))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.withdrawTokenTo(hre.ethers.constants.AddressZero, signer1.address, tenthEther / 2n))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tenthEther / 2n, tenthEther / 2n * -1n],
        )
      await expect(x.stakeManager.withdrawTokenTo(hre.ethers.constants.AddressZero, signer1.address, tenthEther / 2n))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tenthEther / 2n, tenthEther / 2n * -1n],
        )
      expectedBalance -= tenthEther // 89999999999999999
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.addTipToStake(false, hre.ethers.constants.AddressZero, nextStakeId, tenthEther, 0))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      const encodedTip = await x.stakeManager.encodeTipSettings(false, 0, tipAmount, 0)
      await expect(x.stakeManager.removeTipsFromStake(nextStakeId, [0]))
        .to.emit(x.stakeManager, 'RemoveTip')
        .withArgs(nextStakeId, hre.ethers.constants.AddressZero, 0, encodedTip)
      expectedBalance += tipAmount // 910000000000000000
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.withdrawTokenTo(hre.ethers.constants.AddressZero, signer1.address, tenthEther))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tenthEther, tenthEther * -1n],
        )
      expectedBalance -= tenthEther // 81000000000000000
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer1.address))
        .eventually.to.equal(expectedBalance)
    })
    it('can shift tips to next stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const settings = await x.stakeManager.defaultSettings()
      const updatedEncodedSettings = await x.stakeManager.encodeSettings({
        ...settings,
        consentAbilities: {
          ...settings.consentAbilities,
          copyExternalTips: true,
        },
      })
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 10, updatedEncodedSettings))
        .to.emit(x.hex, 'StakeStart')
      const linearEncoded = await x.stakeManager.encodeLinear({
        ...zeroLinear,
        xFactor: 1,
        x: 1,
        y: 10,
      })
      await x.stakeManager.depositAndAddTipToStake(
        true,
        hre.ethers.constants.AddressZero,
        x.nextStakeId,
        x.oneEther / 100n,
        linearEncoded,
        {
          value: x.oneEther / 100n,
        }
      )
      await utils.moveForwardDays(11, x)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const encodedNextTip = await x.stakeManager.encodeTipSettings(
        true,
        0,
        (x.oneEther / 100n) - (x.oneEther / 1_000n),
        linearEncoded,
      )
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentWithTipTo(x.nextStakeId, signer3.address))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.stakeManager, 'Tip')
        .withArgs(
          x.nextStakeId,
          hre.ethers.constants.AddressZero,
          signer3.address,
          x.oneEther / 1_000n,
        )
        .to.emit(x.stakeManager, 'AddTip')
        .withArgs(
          nextStakeId,
          hre.ethers.constants.AddressZero,
          0,
          encodedNextTip,
        )
    })
    it('leaves unattributed hedron tokens until they are utilized', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHedron = hre.ethers.utils.parseUnits('100', 12).toBigInt()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        hedronTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHedron,
        },
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('00001101', 2)),
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      const encodedStoredSettings = await x.stakeManager.stakeIdToSettings(nextStakeId)
      const storedSettings = await x.stakeManager.decodeSettings(encodedStoredSettings)
      expect(storedSettings.hedronTip.y).to.equal(oneHundredHedron)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
      await expect(x.stakeManager.getUnattributed(x.hedron.address))
        .eventually.to.be.greaterThan(0)
    })
    it('attributes hedron tokens when an address is presented', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHedron = hre.ethers.utils.parseUnits('100', 9).toBigInt()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        hedronTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHedron,
        },
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('00001101', 2)),
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      const encodedStoredSettings = await x.stakeManager.stakeIdToSettings(nextStakeId)
      const storedSettings = await x.stakeManager.decodeSettings(encodedStoredSettings)
      expect(storedSettings.hedronTip.y).to.equal(oneHundredHedron)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentWithTipTo(nextStakeId, signer2.address))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.stakeManager, 'Tip')
        .withArgs(
          x.nextStakeId,
          x.hedron.address,
          signer2.address,
          oneHundredHedron,
        )
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signer2.address))
        .eventually.to.equal(oneHundredHedron)
      await expect(x.stakeManager.getUnattributed(x.hedron.address))
        .eventually.to.equal(0)
    })
    it('leaves unattributed tokens until they are utilized', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHex,
        },
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId)
      await expect(x.stakeManager.getUnattributed(x.hex.address))
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.clamp(oneHundredHex + 1n, oneHundredHex))
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.stakeStartFromUnattributedFor(signer2.address, oneHundredHex + 1n, 30, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, oneHundredHex)
      await expect(x.stakeManager.getUnattributed(x.hex.address))
        .eventually.to.equal(0)
    })
    it('attributes hex tokens when an address is presented', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: {
          ...zeroLinear,
          method: 1,
          y: oneHundredHex,
        },
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)

      await expect(x.stakeManager.connect(signer2).stakeEndByConsentWithTipTo(nextStakeId, signer2.address))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.stakeManager, 'Tip')
        .withArgs(
          x.nextStakeId,
          x.hex.address,
          signer2.address,
          oneHundredHex,
        )
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.getUnattributed(x.hex.address))
        .eventually.to.equal(0)
    })
    it('can also start a stake with withdrawable mapping', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      await expect(x.stakeManager.depositTokenTo(x.hex.address, signer1.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, oneHundredHex)
      await expect(x.stakeManager.depositTokenTo(x.hex.address, signer1.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, oneHundredHex)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer1.address))
        .eventually.to.equal(oneHundredHex * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeStartFromWithdrawableFor(signer2.address, oneHundredHex * 2n, days, 0))
        .to.emit(x.hex, 'StakeStart')
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, oneHundredHex * 2n)
      await expect(x.stakeManager.stakeIdToOwner(nextStakeId))
        .eventually.to.equal(signer2.address)
    })
    it('allows settings to be passed at the same time', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1101', 2)),
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyUint, x.stakeManager.address, nextStakeId)
      await utils.moveForwardDays(11, x)
      await expect(x.stakeManager.stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'StakeStart')
        .to.emit(x.hex, 'StakeEnd')
    })
    it('can disallow end stakes by anyone', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      let updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1100', 2)),
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyUint, x.stakeManager.address, nextStakeId)
      await utils.moveForwardDays(11, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .not.to.emit(x.hex, 'StakeEnd')
      updatedSettings = {
        ...updatedSettings,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1101', 2)),
      }
      await expect(x.stakeManager.multicall([
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          nextStakeId,
          updatedSettings,
        ]),
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, nextStakeId)
    })
    it('can tip in any currency', async () => {
      const x = await loadFixture(utils.deployFixture)
      const days = 10
      const [signer1, signer2] = x.signers
      const stakeId = await utils.nextStakeId(x.hex)
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      const decimals = await x.usdc.decimals()
      const tipAmount = hre.ethers.utils.parseUnits('100', decimals).toBigInt()
      const usdcCurrencyIndex = await x.stakeManager.currencyListSize()
      await utils.leechUsdc(hre.ethers.utils.parseUnits('1000', decimals).toBigInt(), signer1.address, x)
      await x.usdc.approve(x.stakeManager.address, tipAmount) // allow stake manager to pull in tip currency
      await expect(x.stakeManager.depositAndAddTipToStake(false, x.usdc.address, stakeId, tipAmount, 0))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await expect(x.stakeManager.addCurrencyToList(x.usdc.address))
        .to.emit(x.stakeManager, 'AddCurrency')
        .withArgs(x.usdc.address, usdcCurrencyIndex)
      await expect(x.stakeManager.depositTokenTo(x.usdc.address, signer1.address, tipAmount))
        .to.emit(x.usdc, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, tipAmount)
      const encodedTip = await x.stakeManager.encodeTipSettings(false, usdcCurrencyIndex, tipAmount, 0)
      await expect(x.stakeManager.addTipToStake(false, x.usdc.address, stakeId, tipAmount, 0))
        .to.emit(x.stakeManager, 'AddTip')
        .withArgs(stakeId, x.usdc.address, 0, encodedTip)
      await utils.moveForwardDays(days + 1, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(stakeId))
        .to.emit(x.hex, 'StakeEnd')
      await expect(x.stakeManager.getUnattributed(x.usdc.address))
        .eventually.to.equal(tipAmount)
      await expect(x.stakeManager.connect(signer2).collectUnattributed(x.usdc.address, true, signer2.address, tipAmount / 2n))
        .to.emit(x.usdc, 'Transfer')
        .withArgs(x.stakeManager.address, signer2.address, tipAmount / 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(x.usdc.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer2).collectUnattributed(x.usdc.address, false, signer2.address, tipAmount / 2n))
        .not.to.emit(x.usdc, 'Transfer')
      await expect(x.stakeManager.withdrawableBalanceOf(x.usdc.address, signer2.address))
        .eventually.to.be.equal(tipAmount / 2n)
    })
    it('cannot end early by default', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(10, x)
      await expect(x.stakeManager.stakeEndByConsent(nextStakeId))
        .not.to.emit(x.hex, 'StakeEnd')
      const settings = await x.stakeManager.stakeIdSettings(nextStakeId)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1111', 2)), // 2nd to last index in binary flags
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
    })
    it('can end early if owned by tx signer', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(days, x)
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'StakeEnd')
    })
    it('can end on same day and returns all hex', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      // tell the system to send tokens back to staker
      const settings = defaultSettings.toBigInt() | (1n << 4n)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, settings))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
      // sometimes people change their mind and should be able to get their funds back
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.stakedAmount)
    })
    it('can shield transaction behind a deadline', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      // tell the system to send tokens back to staker
      const settings = defaultSettings.toBigInt() | (1n << 4n)
      await time.setNextBlockTimestamp(Math.ceil(_.now() / 1_000))
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, settings) // nextStakeId
      await time.setNextBlockTimestamp(Math.ceil(_.now() / 1_000) + 1)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, settings) // nextStakeId + 1n
      await time.setNextBlockTimestamp(Math.ceil(_.now() / 1_000) + 2)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, settings) // nextStakeId + 2n
      await time.setNextBlockTimestamp(Math.ceil(_.now() / 1_000) + 3)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, settings) // nextStakeId + 3n
      const now = Date.now()
      const deadline = Math.floor((now - (now % utils.DAY) + utils.DAY) / 1_000) - 1
      await time.setNextBlockTimestamp(deadline)
      const stakeEndBeforeDeadline = x.stakeManager.stakeEndById(nextStakeId)
      await expect(stakeEndBeforeDeadline)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.stakedAmount)

      await time.setNextBlockTimestamp(deadline)
      await expect(x.stakeManager.multicallWithDeadline(deadline, [
        x.stakeManager.interface.encodeFunctionData('stakeEndById', [
          nextStakeId + 1n,
        ]),
      ], false))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.stakedAmount)

      const currentTime = deadline + 1
      await time.setNextBlockTimestamp(deadline + 1)
      await expect(x.stakeManager.stakeEndById(nextStakeId + 2n))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, withArgs.anyUint)
      await time.setNextBlockTimestamp(deadline + 1)
      await expect(x.stakeManager.multicallWithDeadline(deadline, [
        x.stakeManager.interface.encodeFunctionData('stakeEndById', [
          nextStakeId + 3n,
        ]),
      ], false))
        .to.revertedWithCustomError(x.stakeManager, 'Deadline')
        .withArgs(deadline, currentTime)
    })
    it('null ends result in no failure', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 10
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, defaultSettings)
      await utils.moveForwardDays(11, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .not.to.reverted
        .not.to.emit(x.hex, 'Transfer')
    })
  })
  describe('balanceOf', () => {
    it('passes a balance of check to target (hex)', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.hex.balanceOf(signer1.address))
        .eventually.to.equal(await x.stakeManager.balanceOf(signer1.address))
      await expect(x.hex.balanceOf(signer1.address))
        .eventually.to.be.greaterThan(0)
    })
  })
  describe('stakeGoodAccounting', () => {
    let x!: Awaited<ReturnType<typeof utils.deployFixture>>
    beforeEach(async () => {
      x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStartFromBalanceFor(x.signers[0].address, x.stakedAmount, 15, 0)
      await utils.moveForwardDays(16, x)
    })
    it('can check if a stake is good accountable', async () => {
      const nextStakeId = await utils.nextStakeId(x.hex)
      await x.stakeManager.stakeStartFromBalanceFor(x.signers[0].address, x.stakedAmount, 15, 0) // nextStakeId + 1
      await expect(x.stakeManager.isGoodAccountable(x.stakeManager.address, 2, nextStakeId))
        .eventually.to.equal(4)
      await expect(x.stakeManager.isStakeIdGoodAccountable(nextStakeId))
        .eventually.to.equal(2)
      await expect(x.stakeManager.isStakeIdGoodAccountable(x.nextStakeId))
        .eventually.to.equal(0)
      await x.stakeManager.checkStakeGoodAccounting(x.nextStakeId)
      await expect(x.stakeManager.isStakeIdGoodAccountable(x.nextStakeId))
        .eventually.to.equal(1)
      await expect(x.stakeManager.stakeEnd(0, x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
      await expect(x.stakeManager.isStakeIdGoodAccountable(x.nextStakeId))
        .eventually.to.equal(3)
    })
    it('can perform good accounting', async () => {
      await expect(x.stakeManager.stakeGoodAccounting(
        x.stakeManager.address,
        0,
        x.nextStakeId,
      ))
      .to.emit(x.hex, 'StakeGoodAccounting')
      await expect(x.hex.stakeGoodAccounting(
        x.stakeManager.address,
        0,
        x.nextStakeId,
      )).to.reverted
      await expect(x.stakeManager.checkStakeGoodAccountingFor(
        x.stakeManager.address,
        0,
        x.nextStakeId,
      )).not.to.reverted
      .not.to.emit(x.hex, 'StakeGoodAccounting')
    })
    it('can perform good accounting without index', async () => {
      await expect(x.stakeManager.checkStakeGoodAccounting(
        x.nextStakeId,
      ))
      .to.emit(x.hex, 'StakeGoodAccounting')
      await expect(x.hex.stakeGoodAccounting(
        x.stakeManager.address,
        0,
        x.nextStakeId,
      )).to.reverted
      await expect(x.stakeManager.checkStakeGoodAccounting(
        x.nextStakeId,
      )).not.to.reverted
      .not.to.emit(x.hex, 'StakeGoodAccounting')
    })
  })
})
