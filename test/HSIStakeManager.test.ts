import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"

describe('HSIStakeManager.sol', () => {
  describe('depositHsi', () => {
    it('can deposit hsis into the contract', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [
          target.tokenId,
          0,
        ]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
    })
  })
  describe('withdrawHsi', () => {
    it('can withdraw an hsi', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await expect(x.hsiStakeManager.connect(x.signers[1]).withdrawHsi(x.hsiTargets[0].hsiAddress))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(x.signers[1].address, x.signers[0].address)
      await expect(x.hsiStakeManager.withdrawHsi(x.hsiTargets[0].hsiAddress))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, x.hsiTargets[0].hsiAddress, x.hsiStakeManager.address)
    })
    it('can withdraw tips as well', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      const currencyIndex = await x.stakeManager.currencyListSize()
      const amount = hre.ethers.utils.parseUnits('10', await x.usdc.decimals()).toBigInt()
      const tipSettings = await x.hsiStakeManager.encodeTipSettings(currencyIndex, amount, 1, 1)
      const stakeId = await x.hsiStakeManager.hsiAddressToId(x.hsiTargets[0].hsiAddress)
      await x.hsiStakeManager.addCurrencyToList(x.usdc.address)
      await utils.leechUsdc(amount, x.signers[0].address, x)
      await x.usdc.approve(x.hsiStakeManager.address, amount)
      await expect(x.hsiStakeManager.depositAndAddTipToStake(x.usdc.address, stakeId, amount, 1, 1))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address)
      await x.hsiStakeManager.depositAndAddTipToStake(x.usdc.address, x.hsiTargets[0].hsiAddress, amount, 1, 1)
      const tx = await x.hsiStakeManager.withdrawHsi(x.hsiTargets[0].hsiAddress)
      await expect(tx)
        .to.emit(x.hsiStakeManager, 'RemoveTip')
        .withArgs(x.hsiTargets[0].hsiAddress, x.usdc.address, 0, tipSettings)
    })
  })
  describe('mintRewardsFromHSIAddress', () => {
    it('can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1] = x.signers
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false)
      await utils.moveForwardDays(10, x)
      await expect(x.hsiStakeManager.withdrawableBalanceOf(x.hedron.address, signer1.address))
        .eventually.to.equal(0)
      await expect(x.hsiStakeManager.mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
        // .printGasUsage()
      await expect(x.hsiStakeManager.withdrawableBalanceOf(x.hedron.address, signer1.address))
        .eventually.to.be.greaterThan(0)
    })
    it('anyone can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const defaultEncodedSettings = await x.hsiStakeManager.defaultEncodedSettings()
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ])), false)
      const [, signerB] = x.signers
      await utils.moveForwardDays(10, x)
      await expect(x.hsiStakeManager.connect(signerB).mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
    })
    it('end deposited stakes', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const defaultEncodedSettings = await x.hsiStakeManager.defaultEncodedSettings()
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ]))
      await expect(x.hsiStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30, x)
      // 30 day stake is in last
      const targetStakeIdAsHsi = x.hsiTargets[0]
      await expect(x.hsiStakeManager.hsiStakeEndMany([targetStakeIdAsHsi.hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, targetStakeIdAsHsi.hsiAddress, targetStakeIdAsHsi.stakeId)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, targetStakeIdAsHsi.hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(targetStakeIdAsHsi.hsiAddress, x.hsiStakeManager.address, anyUint)
    })
    it('end deposited stakes in any order', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const defaultEncodedSettings = await x.hsiStakeManager.defaultEncodedSettings()
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ]))
      await expect(x.hsiStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(90, x)
      // 30 day stake is in last
      await expect(x.hsiStakeManager.hsiStakeEndMany(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiTargets[0].hsiAddress, x.hsiTargets[0].stakeId)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiTargets[1].hsiAddress, x.hsiTargets[1].stakeId)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiTargets[2].hsiAddress, x.hsiTargets[2].stakeId)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiTargets[0].hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiTargets[0].hsiAddress, x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
    })
  })
  describe('setSettings', () => {
    it('sets settings', async function () {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      // give 10% of the yield to the end staker
      const encoded10Percent = (1n << 32n) | 10n
      const settings = {
        hedronTipMethod: 6,
        hedronTipMagnitude: encoded10Percent,
        tipMethod: 6,
        tipMagnitude: encoded10Percent,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('001111', 2)),
        // unused on hsi
        newStakeDaysMethod: 0,
        newStakeDaysMagnitude: 0,
        newStakeMethod: 0,
        newStakeMagnitude: 0,
        copyIterations: 0,
      }
      const encodedSettings = await x.hsiStakeManager.encodeSettings(settings)
      const firstStakeTarget = x.hsiTargets[0]
      const lastHsiTarget = x.hsiTargets[x.hsiTargets.length - 1]
      const defaultEncoded = await x.hsiStakeManager.defaultEncodedSettings()
      await expect(x.hsiStakeManager.multicall(_.map(x.hsiTargets, (target) => (
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [
          target.tokenId,
          target === lastHsiTarget ? defaultEncoded : encodedSettings,
        ])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
        // .printGasUsage()
      await expect(x.hsiStakeManager.stakeIdToSettings(firstStakeTarget.hsiAddress))
        .eventually.to.equal(encodedSettings)
      // const lastStake = await x.hex.stakeLists(lastHsiTarget.hsiAddress, 0)
      await expect(x.hsiStakeManager.stakeIdToSettings(lastHsiTarget.hsiAddress))
        .eventually.to.equal(defaultEncoded)
      const lastStakeIdSettings = await x.hsiStakeManager.stakeIdToSettings(lastHsiTarget.hsiAddress)
      const defaultSettings = await x.hsiStakeManager.defaultSettings()
      await expect(x.hsiStakeManager.decodeSettings(lastStakeIdSettings))
        .eventually.to.deep.equal(defaultSettings)
      await utils.moveForwardDays(30, x)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        tipMethod: 0,
        tipMagnitude: 0,
      }
      await expect(x.hsiStakeManager.connect(signer2).updateSettings(firstStakeTarget.hsiAddress, updatedSettings))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      const encodedUpdatedSettings = await x.hsiStakeManager.encodeSettings(updatedSettings)
      await expect(x.hsiStakeManager.updateSettings(firstStakeTarget.hsiAddress, updatedSettings))
        .to.emit(x.hsiStakeManager, 'UpdateSettings')
        .withArgs(firstStakeTarget.hsiAddress, encodedUpdatedSettings)
        // this line is required
        // for some reason, the test fails without it
        // .printGasUsage()

      await expect(x.hsiStakeManager.connect(signer2).hsiStakeEndMany([firstStakeTarget.hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
    })
  })
  describe('restarting hsis', async () => {
    it('will restart an hsi with the appropriate inputs', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      const settings = {
        hedronTipMethod: 0,
        hedronTipMagnitude: 0,
        tipMethod: 0,
        tipMagnitude: 0,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('001101', 2)),
        // unused on hsi
        newStakeDaysMethod: 2,
        newStakeDaysMagnitude: 0,
        newStakeMethod: 4,
        newStakeMagnitude: 1n << 32n | 1n,
        copyIterations: 0,
      }
      const encodedSettings = await x.stakeManager.encodeSettings(settings)
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, encodedSettings]),
      ]))
      await expect(x.hsiStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30, x)
      const nextStakeId = await utils.nextStakeId(x)
      await expect(x.hsiStakeManager.connect(signer2).hsiStakeEndMany([x.hsiTargets[0].hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiTargets[0].hsiAddress, x.hsiTargets[0].stakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, anyValue, nextStakeId)
    })
  })
})
