import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
// import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

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
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, 0)
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
        .eventually.to.equal(4)
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
})
