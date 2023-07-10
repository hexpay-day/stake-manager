import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('SingletonHedronManager.sol', () => {
  describe('mintRewards', () => {
    it('mints rewards from stakes', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...settings,
        consentAbilities: parseInt('1101', 2),
      }
      const data = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          stakeId,
          nuSettings,
        ])
      )))
      const [signerA] = x.signers
      await x.stakeManager.connect(signerA).multicall(data, false)
      await utils.moveForwardDays(2, x)
      await expect(x.stakeManager.mintRewards(x.stakeIds))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, anyUint)
      await expect(x.hedron.balanceOf(x.stakeManager.address))
        .eventually.to.equal(await x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerA.address))
    })
    it('can withdraw rewards at a later time', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...settings,
        consentAbilities: parseInt('1101', 2),
      }
      const data = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          stakeId,
          nuSettings,
        ])
      )))
      const [signerA] = x.signers
      await x.stakeManager.connect(signerA).multicall(data, false)
      await utils.moveForwardDays(2, x)
      await x.stakeManager.mintRewards(x.stakeIds)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.address, signerA.address, 100))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signerA.address, 100)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.be.equal(100)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.address, signerA.address, 0))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signerA.address, anyUint)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.be.greaterThan(100)
      await utils.moveForwardDays(2, x)
      await x.stakeManager.mintRewards(x.stakeIds)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.address, signerA.address, hre.ethers.constants.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signerA.address, anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerA.address))
        .eventually.to.equal(0)
    })
    it('can mint for multiple addresses at the same time', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...settings,
        consentAbilities: parseInt('1101', 2),
      }
      const [signerA, signerB] = x.signers
      const nextStakeId = await utils.nextStakeId(x)
      await x.stakeManager.connect(signerB).stakeStart(x.stakedAmount, 30)
      const stakeIds = x.stakeIds.concat(nextStakeId)
      const signerAUpdateSettings = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          stakeId,
          nuSettings,
        ])
      )))
      await x.stakeManager.connect(signerA).multicall(signerAUpdateSettings, false)
      const signerBUpdateSettings = await Promise.all([nextStakeId].map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          stakeId,
          nuSettings,
        ])
      )))
      await x.stakeManager.connect(signerB).multicall(signerBUpdateSettings, false)
      await utils.moveForwardDays(2, x)
      await x.stakeManager.mintRewards(stakeIds)

      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerA.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerB.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.stakeManager.connect(signerA).withdrawTokenTo(x.hedron.address, signerA.address, hre.ethers.constants.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signerA.address, anyUint)
      await expect(x.stakeManager.connect(signerB).withdrawTokenTo(x.hedron.address, signerB.address, hre.ethers.constants.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.stakeManager.address, signerB.address, anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerA.address))
        .eventually.to.be.equal(0)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.address, signerB.address))
        .eventually.to.be.equal(0)
    })
  })
})
