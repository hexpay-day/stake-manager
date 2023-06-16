import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
// import * as hre from "hardhat"
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
  describe('parsing values', () => {
    it('has a method for that', async () => {
      const x = await loadFixture(utils.deployFixture)
      const defaultEncodedSettings = await x.stakeManager.defaultEncodedSettings()
      const defaultSettings = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 144, 8))
        .eventually.to.equal(defaultSettings.newStakeMethod)
        .eventually.to.equal(1)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 216, 8))
        .eventually.to.equal(defaultSettings.newStakeDaysMethod)
        .eventually.to.equal(6)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 240, 8))
        .eventually.to.equal(defaultSettings.copyIterations)
        .eventually.to.equal(255)
      await expect(x.stakeManager.readEncodedSettings(defaultEncodedSettings, 248, 8))
        .eventually.to.equal(defaultSettings.consentAbilities)
        .eventually.to.equal(1)
    })
  })
})
