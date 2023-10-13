import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { fromStruct } from '../src/utils'

describe('SingletonMintManager.sol', () => {
  describe('mintRewards', () => {
    it('mints rewards from stakes', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...fromStruct(settings),
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1101', 2)).then(fromStruct),
      }
      const data = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettingsEncoded', [
          stakeId,
          await x.stakeManager.encodeSettings(nuSettings),
        ])
      )))
      const [signerA] = x.signers
      await x.stakeManager.connect(signerA).multicall(data, false)
      await utils.moveForwardDays(2n, x)
      await expect(x.stakeManager.mintHedronRewards(x.stakeIds))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
      await expect(x.hedron.balanceOf(x.stakeManager.getAddress()))
        .eventually.to.equal(await x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerA.address))
    })
    it('can withdraw rewards at a later time', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...fromStruct(settings),
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1101', 2)).then(fromStruct),
      }
      const data = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettingsEncoded', [
          stakeId,
          await x.stakeManager.encodeSettings(nuSettings),
        ])
      )))
      const [signerA] = x.signers
      await x.stakeManager.connect(signerA).multicall(data, false)
      await utils.moveForwardDays(2n, x)
      await x.stakeManager.mintHedronRewards(x.stakeIds)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.getAddress(), signerA.address, 100))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signerA.address, 100)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.be.equal(100)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.getAddress(), signerA.address, 0))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signerA.address, anyUint)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.be.greaterThan(100)
      await utils.moveForwardDays(2n, x)
      await x.stakeManager.mintHedronRewards(x.stakeIds)
      await expect(x.stakeManager.withdrawTokenTo(x.hedron.getAddress(), signerA.address, hre.ethers.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signerA.address, anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerA.address))
        .eventually.to.equal(0)
    })
    it('can mint for multiple addresses at the same time', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...fromStruct(settings),
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('1101', 2)).then(fromStruct),
      }
      const [signerA, signerB] = x.signers
      const nextStakeId = await utils.nextStakeId(x.hex)
      await x.stakeManager.connect(signerB).stakeStart(x.stakedAmount, 30)
      const stakeIds = x.stakeIds.concat(nextStakeId)
      const signerAUpdateSettings = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettingsEncoded', [
          stakeId,
          await x.stakeManager.encodeSettings(nuSettings),
        ])
      )))
      await x.stakeManager.connect(signerA).multicall(signerAUpdateSettings, false)
      const signerBUpdateSettings = await Promise.all([nextStakeId].map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettingsEncoded', [
          stakeId,
          await x.stakeManager.encodeSettings(nuSettings),
        ])
      )))
      await x.stakeManager.connect(signerB).multicall(signerBUpdateSettings, false)
      await utils.moveForwardDays(2n, x)
      await x.stakeManager.mintHedronRewards(stakeIds)

      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerA.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerB.address))
        .eventually.to.be.greaterThan(0)
      await expect(x.stakeManager.connect(signerA).withdrawTokenTo(x.hedron.getAddress(), signerA.address, hre.ethers.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signerA.address, anyUint)
      await expect(x.stakeManager.connect(signerB).withdrawTokenTo(x.hedron.getAddress(), signerB.address, hre.ethers.MaxInt256))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signerB.address, anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerA.address))
        .eventually.to.be.equal(0)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signerB.address))
        .eventually.to.be.equal(0)
    })
  })
})
