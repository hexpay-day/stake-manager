import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as withArgs from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import * as utils from './utils'
import { EncodableSettings, IStakeable, StakeManager } from "../artifacts/types"

describe("StakeManager", function () {
  describe("deployment", function () {
    it('should have a percentMagnitudeLimit', async function() {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.percentMagnitudeLimit()).eventually.to.equal(
        hre.ethers.BigNumber.from(2).pow(64).toBigInt() - 1n
      )
    })
  })
  describe('UnderlyingStakeable', () => {
    it('should count its stakes', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.stakeCount())
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer1).stakeStart(x.stakedAmount, 10)
      await expect(x.stakeManager.stakeCount())
        .eventually.to.equal(1)
    })
  })

  describe('encodeSettings/decodeSettings', () => {
    it('encodes and decodes settings', async () => {
      const x = await loadFixture(utils.deployFixture)
      const defaultEncoded = await x.stakeManager.DEFAULT_ENCODED_SETTINGS()
      const defaultDecoded = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.encodeSettings(defaultDecoded))
        .eventually.to.equal(defaultEncoded)
      await expect(x.stakeManager.decodeSettings(defaultEncoded))
        .eventually.to.be.deep.equal(defaultDecoded)
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
      await expect(x.stakeManager.isEarlyEnding(stake, await x.hex.currentDay()))
        .eventually.to.be.true
      await utils.moveForwardDays(5, x)
      await expect(x.stakeManager.isEarlyEnding(stake, await x.hex.currentDay()))
        .eventually.to.be.true
      await utils.moveForwardDays(6, x)
      await expect(x.stakeManager.isEarlyEnding(stake, await x.hex.currentDay()))
        .eventually.to.be.false
    })
  })
  describe("withdrawals", () => {
    it("should not allow too much to be withdrawn", async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.connect(signer3).withdrawTokenTo(signer1.address, 1))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(0, 1)
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(signer1.address, 1n + x.oneMillion))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(x.oneMillion, 1n + x.oneMillion)
    })
    it('should allow the contract to define how much to withdraw', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositTokenTo(signer1.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer1).withdrawTokenTo(signer1.address, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.oneMillion * 2n)
    })
  })
  describe('depositing tokens', async () => {
    it('can transfer tokens from sender to contract', async function() {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.tokensAttributed())
        .eventually.to.equal(x.oneMillion)
    })
    it('can deposit tokens and not attribute them to self', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositTokenUnattributed(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.tokensAttributed())
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
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotEndable')
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
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotEndable')
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
      this.timeout(100_000_000)
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 369
      const half1 = Math.floor(days / 2)
      const half2 = days - half1
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, days, 0]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, days, 0]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(x.stakeManager.connect(signer3).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, days, 0]),
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
        x.SingletonStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 4n,
        ]),
        x.SingletonStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 2n,
        ]),
        x.SingletonStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
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
        // .printGasUsage()
      await expect(x.hex.stakeCount(x.stakeManager.address)).eventually.to.equal(6)
    })
  })
  describe('stakeEndByConsentForMany', () => {
    it('custodies funds if told to do nothing with them afterward', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 3
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.stakedAmount)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.stakedAmount)
      await utils.moveForwardDays(4, x)
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings = {
        ...settings,
        newStakeMethod: 0,
      }
      await x.stakeManager.updateSettings(x.nextStakeId, updatedSettings)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.be.equal(0)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([x.nextStakeId]))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.be.greaterThan(0)
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
      let nextStakeId = await utils.nextStakeId(x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([lastStakeId]))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.be.equal(0)
      await utils.moveForwardDays(4, x)
      lastStakeId = nextStakeId
      nextStakeId = await utils.nextStakeId(x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([lastStakeId]))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.be.equal(0)
      await utils.moveForwardDays(4, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsentForMany([nextStakeId]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyValue, withArgs.anyValue, x.stakeManager.address, nextStakeId)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.be.greaterThan(0)
    })
    it('cannot update settings unless signer is staker', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        tipMethod: 2,
        tipMagnitude: oneHundredHex, // 100 hex
      }
      await expect(x.stakeManager.connect(signer2).updateSettings(nextStakeId, updatedSettings))
        .revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
    })
    it('allows staker to leave a tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        tipMethod: 1,
        tipMagnitude: oneHundredHex, // 100 hex
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdatedSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      // this is an underestimation since yield is also a factor in this case
      const anticipatedTip = await x.stakeManager.connect(signer2).computeEnderTip(nextStakeId, oneHundredHex)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          true,
          signer2.address,
          0,
        ]),
      ], false))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer2.address, oneHundredHex)
        // restart the stake
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
      await expect(x.hex.balanceOf(signer2.address))
        .eventually.greaterThan(anticipatedTip.toNumber())
    })
    it('can leave the tip in the withdrawable mapping', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        tipMethod: 1,
        tipMagnitude: oneHundredHex, // 100 hex
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdatedSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectUnattributed', [
          false,
          signer2.address,
          0,
        ]),
      ], false)
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(signer2.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer2.address, oneHundredHex)
    })
    it('leaves a native tip for the ender', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositNativeToStake(signer1.address, nextStakeId, tipAmount, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await expect(x.stakeManager.nativeBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await expect(x.stakeManager.stakeIdToNativeTip(nextStakeId))
        .eventually.to.equal(tipAmount)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectNativeUnattributed', [
          false,
          signer2.address,
          0,
        ]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
      await expect(x.stakeManager.nativeBalanceOf(signer2.address))
        .eventually.to.equal(tipAmount)
    })
    it('unattributed can be withdrawn', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositNativeToStake(signer1.address, nextStakeId, tipAmount, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await expect(x.stakeManager.nativeBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await expect(x.stakeManager.stakeIdToNativeTip(nextStakeId))
        .eventually.to.equal(tipAmount)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('collectNativeUnattributed', [
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
      await expect(x.stakeManager.nativeBalanceOf(signer2.address))
        .eventually.to.equal(0)
    })
    it('tracks unattributed through a global var', async () => {
      const x = await loadFixture(utils.deployFixture)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      await expect(x.stakeManager.getNativeUnattributed())
        .eventually.to.equal(0)
      await x.signers[0].sendTransaction({
        value: oneEther,
        to: x.stakeManager.address,
      })
      await expect(x.stakeManager.getNativeUnattributed())
        .eventually.to.equal(0)
    })
    it('if own stake is ended, can claw back tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositNativeToStake(signer1.address, nextStakeId, tipAmount, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await x.stakeManager.removeNativeTipFromStake(nextStakeId)
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther - tipAmount, 'clawing back tips is not currently allowed')
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await x.stakeManager.removeNativeTipFromStake(nextStakeId)
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther)
    })
    it('if own stake is ended, cannot add to tip', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, days * 2, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      await expect(x.stakeManager.depositNativeToStake(signer1.address, nextStakeId, tipAmount, {
        value: oneEther,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [oneEther * -1n, oneEther],
        )
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther - tipAmount)
      await x.stakeManager.removeNativeTipFromStake(nextStakeId)
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(oneEther)
      await expect(x.stakeManager.addNativeTipToStake(nextStakeId, tipAmount))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
    it('can withdraw from native balance at any time', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(days + 1, x)
      const oneEther = hre.ethers.utils.parseEther('1').toBigInt()
      const tipAmount = oneEther / 100n
      const tenthEther = oneEther / 10n
      await expect(x.stakeManager.depositNative({
        value: oneEther - 2n,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [(oneEther - 2n) * -1n, (oneEther - 2n)],
        )
      await expect(x.stakeManager.connect(signer2).depositNativeTo(signer1.address, {
        value: 1n
      }))
      .to.changeEtherBalances(
        [signer2, x.stakeManager],
        [-1n, 1n],
      )
      await expect(x.stakeManager.depositNativeToStake(signer1.address, nextStakeId, tipAmount, {
        value: 1n,
      }))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [-1n, 1n],
        )
      let expectedBalance = oneEther - tipAmount
      await expect(x.stakeManager.stakeEndById(nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.changeEtherBalances(
          [x.stakeManager, signer1],
          [0, 0],
        )
      await expect(x.stakeManager.withdrawNativeTo(signer1.address, tenthEther))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tenthEther, tenthEther * -1n],
        )
      expectedBalance -= tenthEther
      await x.stakeManager.removeNativeTipFromStake(nextStakeId)
      expectedBalance += tipAmount
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(expectedBalance)
      await expect(x.stakeManager.withdrawNativeTo(signer1.address, tenthEther))
        .to.changeEtherBalances(
          [signer1, x.stakeManager],
          [tenthEther, tenthEther * -1n],
        )
      expectedBalance -= tenthEther
      await expect(x.stakeManager.nativeBalanceOf(signer1.address))
        .eventually.to.equal(expectedBalance)
    })
    it('leaves unattributed tokens until they are utilized', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        tipMethod: 1,
        tipMagnitude: oneHundredHex, // 100 hex
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdatedSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId)
      await expect(x.stakeManager.getUnattributed())
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.clamp(oneHundredHex + 1n, oneHundredHex))
        .eventually.to.equal(oneHundredHex)
      await expect(x.stakeManager.stakeStartFromUnattributedFor(signer2.address, oneHundredHex + 1n, 30, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, oneHundredHex)
      await expect(x.stakeManager.getUnattributed())
        .eventually.to.equal(0)
    })
    it('can also start a stake with withdrawable mapping', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
      await expect(x.stakeManager.depositTokenTo(signer1.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, oneHundredHex)
      await expect(x.stakeManager.depositTokenTo(signer1.address, oneHundredHex))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, oneHundredHex)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.equal(oneHundredHex * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeStartFromWithdrawableFor(signer2.address, oneHundredHex * 2n, days, 0))
        .to.emit(x.hex, 'StakeStart')
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, oneHundredHex * 2n)
      await expect(x.stakeManager.stakeIdToOwner(nextStakeId))
        .eventually.to.equal(signer2.address)
    })
    it('allows for automatic withdrawal', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        withdrawableMethod: 4,
        withdrawableMagnitude: (1n << 32n) | 1n,
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdatedSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, withArgs.anyUint)
    })
    it('allows settings to be passed at the same time', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: parseInt('1101', 2),
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
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      let updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: parseInt('1100', 2),
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
        consentAbilities: parseInt('1101', 2),
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
    it('cannot end early by default', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(10, x)
      await expect(x.stakeManager.stakeEndByConsent(nextStakeId))
        .not.to.emit(x.hex, 'StakeEnd')
      const settings = await x.stakeManager.idToDecodedSettings(nextStakeId)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: parseInt('1111', 2), // 2nd to last index in binary flags
      }
      await expect(x.stakeManager.updateSettings(nextStakeId, updatedSettings))
        .to.emit(x.stakeManager, 'UpdatedSettings')
        .withArgs(nextStakeId, await x.stakeManager.encodeSettings(updatedSettings))
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
    })
    it('null ends result in no failure', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const days = 10
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0)
      await utils.moveForwardDays(11, x)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
        .not.to.reverted
        .not.to.emit(x.hex, 'Transfer')
    })
  })
  describe('computeMagnitude', async () => {
    const oneHundredHex = hre.ethers.utils.parseUnits('100', 8).toBigInt()
    const stake: IStakeable.StakeStoreStruct = {
      stakeId: 0,
      stakedDays: 10,
      lockedDay: 1000,
      stakedHearts: oneHundredHex,
      stakeShares: 1_000n**2n, // 1 m-share
      unlockedDay: 0,
      isAutoStake: false,
    }
    it('0: always returns zero', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(0, 100, 100, stake))
        .eventually.to.equal(0)
    })
    it('1: always returns arg 1', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(1, 1001, 1002, stake))
        .eventually.to.equal(1001)
    })
    it('2: returns the staked days property', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(2, 0, 0, stake))
        .eventually.to.equal(10)
    })
    it('3: returns a computed day based on a tight ladder', async () => {
      const x = await loadFixture(utils.deployFixture)
      let currentDay!: number
      let stk!: IStakeable.StakeStoreStruct
      currentDay = (await x.hex.currentDay()).toNumber()
      stk = {
        ...stake,
        lockedDay: currentDay - 10,
      }
      await expect(x.stakeManager.computeMagnitude(3, 0, currentDay, stk))
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
      await expect(x.stakeManager.computeMagnitude(3, 0, currentDay, stk))
        .eventually.to.equal(6)
    })
    const tenPercentAsUint = (1_000n << 32n) | 10_000n
    const tenPercentOnPrinciple = oneHundredHex*11n/10n
    it('4: always returns a % of input', async () => {
      const x = await loadFixture(utils.deployFixture)
      // do not sub 1 from the x input - needed to ensure rounding correctly
      await expect(x.stakeManager.computeMagnitude(4, tenPercentAsUint, 10_000_000, stake))
        .eventually.to.equal(1_000_000)
    })
    it('5: returns a percent of originating principle', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(5, tenPercentAsUint, tenPercentOnPrinciple, stake))
        .eventually.to.equal(oneHundredHex / 10n)
    })
    it('6: returns a percent of yield', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.computeMagnitude(6, tenPercentAsUint, tenPercentOnPrinciple, stake))
        .eventually.to.equal((tenPercentOnPrinciple - oneHundredHex) / 10n)
    })
  })
})
