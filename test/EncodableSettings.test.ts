import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'

describe('EncodableSettings.sol', () => {
  describe('default methods', () => {
    it('should match', async () => {
      const x = await loadFixture(utils.deployFixture)
      const defaultEncodedSettings = await x.stakeManager.defaultEncodedSettings()
      const decodedSettings = await x.stakeManager.decodeSettings(defaultEncodedSettings)
      await expect(x.stakeManager.defaultSettings())
        .eventually.to.deep.equal(decodedSettings)
    })
  })
  describe('stakeIdSettings', () => {
    it('provides decoded settings', async () => {
      const x = await loadFixture(utils.deployFixture)
      let settings
      settings = await x.stakeManager.stakeIdSettings(0);
      expect(settings.newStakeMagnitude).to.equal(0)
      expect(settings.newStakeMethod).to.equal(0)
      expect(settings.newStakeDaysMagnitude).to.equal(0)
      expect(settings.newStakeDaysMethod).to.equal(0)
      const [signer1] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, defaultSettings)
      settings = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.stakeIdSettings(x.nextStakeId))
        .eventually.to.deep.equal(settings)
    })
  })
  describe('parsing values', () => {
    it('has a method for that', async () => {
      const x = await loadFixture(utils.deployFixture)
      const defaultEncodedSettings = await x.stakeManager.defaultEncodedSettings()
      const defaultSettings = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 144, 8))
        .eventually.to.equal(defaultSettings.newStakeMethod)
        .eventually.to.equal(2)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 216, 8))
        .eventually.to.equal(defaultSettings.newStakeDaysMethod)
        .eventually.to.equal(2)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 240, 8))
        .eventually.to.equal(defaultSettings.copyIterations)
        .eventually.to.equal(255)
      const encodedConsentAbilities = await x.stakeManager.encodeConsentAbilities(defaultSettings.consentAbilities)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 248, 8))
        .eventually.to.equal(encodedConsentAbilities.toNumber())
        .eventually.to.equal(1)
    })
  })
  describe('encode/decodeConsentAbilities', () => {
    it('can encode and decode consent abilities', async () => {
      const x = await loadFixture(utils.deployFixture)
      const abilities = {
        hasExternalTips: false,
        copyExternalTips: true,
        stakeIsTransferrable: false,
        shouldSendTokensToStaker: true,
        canMintHedronAtEnd: false,
        canMintHedron: true,
        canEarlyStakeEnd: false,
        canStakeEnd: true,
      }
      const encoded = await x.stakeManager.encodeConsentAbilities(abilities)
      await expect(x.stakeManager.isCapable(encoded, 7)).eventually.to.equal(false)
      await expect(x.stakeManager.isCapable(encoded, 6)).eventually.to.equal(true)
      await expect(x.stakeManager.isCapable(encoded, 5)).eventually.to.equal(false)
      await expect(x.stakeManager.isCapable(encoded, 4)).eventually.to.equal(true)
      await expect(x.stakeManager.isCapable(encoded, 3)).eventually.to.equal(false)
      await expect(x.stakeManager.isCapable(encoded, 2)).eventually.to.equal(true)
      await expect(x.stakeManager.isCapable(encoded, 1)).eventually.to.equal(false)
      await expect(x.stakeManager.isCapable(encoded, 0)).eventually.to.equal(true)
      const decodedAbilitiesResult = Object.assign([
        abilities.canStakeEnd,
        abilities.canEarlyStakeEnd,
        abilities.canMintHedron,
        abilities.canMintHedronAtEnd,
        abilities.shouldSendTokensToStaker,
        abilities.stakeIsTransferrable,
        abilities.copyExternalTips,
        abilities.hasExternalTips,
      ], abilities)
      await expect(x.stakeManager.decodeConsentAbilities(encoded))
        .eventually.to.deep.equal(decodedAbilitiesResult)
    })
  })
  describe('updateSettingsEncoded', () => {
    it('can update settings', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, 0)
      await expect(x.stakeManager.updateSettingsEncoded(x.nextStakeId, hre.ethers.constants.MaxUint256))
        .to.emit(x.stakeManager, 'UpdateSettings')
      await x.stakeManager.stakeIdToSettings(x.nextStakeId)
    })
  })
  describe('decrementCopyIterations', () => {
    it('returns 0 if 0 is passed (in the second byte)', async () => {
      const x = await loadFixture(utils.deployFixture)
      // settings (uint256) is provided to decrement copy iterations
      await expect(x.stakeManager.decrementCopyIterations(0))
        .eventually.to.equal(0)
    })
    it('preserves number in first byte', async () => {
      const x = await loadFixture(utils.deployFixture)
      // settings (uint256) is provided to decrement copy iterations
      await expect(x.stakeManager.decrementCopyIterations(240n))
        .eventually.to.equal(240n)
    })
    it('returns 255 if 255 is passed (in the second byte)', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.decrementCopyIterations(255n << 8n))
        .eventually.to.equal(255n << 8n)
    })
    it('any number less than 255 in the second byte is decremented', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.decrementCopyIterations(254n << 8n))
        .eventually.to.equal(253n << 8n)
    })
    it('preserves numbers above the second byte', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.decrementCopyIterations(123n << 16n | 254n << 8n))
        .eventually.to.equal(123n << 16n | 253n << 8n)
    })
  })
  describe('encodeNewStakeDaysMethod', () => {
    it('returns a modulated value depending on its size', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.encodeNewStakeDaysMethod(0, 4))
        .eventually.to.equal(0)
      await expect(x.stakeManager.encodeNewStakeDaysMethod(0, 3))
        .eventually.to.equal(3)
      await expect(x.stakeManager.encodeNewStakeDaysMethod(3, 3))
        .eventually.to.equal(15)
    })
  })
})
