import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types/contracts/Tipper"

describe('HSIStakeManager.sol', () => {
  describe('depositHsi', () => {
    it('can deposit hsis into the contract', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
    })
  })
  describe('withdrawHsi', () => {
    it('can withdraw an hsi', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await expect(x.hsiStakeManager.connect(x.signers[1]).withdrawHsi(x.hsiAddresses[0]))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(x.signers[1].address, x.signers[0].address)
      await expect(x.hsiStakeManager.withdrawHsi(x.hsiAddresses[0]))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, x.hsiAddresses[0], x.hsiStakeManager.address)
    })
    it('can withdraw tips as well', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      const currencyIndex = await x.stakeManager.currencyListSize()
      const amount = hre.ethers.utils.parseUnits('10', await x.usdc.decimals()).toBigInt()
      const tipSettings = await x.hsiStakeManager.encodeTipSettings(currencyIndex, amount, 1, 1)
      const stakeId = await x.hsiStakeManager.hsiAddressToId(x.hsiAddresses[0])
      await x.hsiStakeManager.addCurrencyToList(x.usdc.address)
      await utils.leechUsdc(amount, x.signers[0].address, x)
      await x.usdc.approve(x.hsiStakeManager.address, amount)
      await expect(x.hsiStakeManager.depositAndAddTipToStake(x.usdc.address, x.hsiAddresses[0], amount, 1, 1))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address)
      await x.hsiStakeManager.depositAndAddTipToStake(x.usdc.address, stakeId, amount, 1, 1)
      const tx = await x.hsiStakeManager.withdrawHsi(x.hsiAddresses[0])
      await expect(tx)
        .to.emit(x.hsiStakeManager, 'RemoveTip')
        .withArgs(stakeId, x.usdc.address, 0, tipSettings)
    })
  })
  describe('mintRewards', () => {
    it('can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1] = x.signers
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ])), false)
      await utils.moveForwardDays(10, x)
      await expect(x.hsiStakeManager.withdrawableBalanceOf(x.hedron.address, signer1.address))
        .eventually.to.equal(0)
      await expect(x.hsiStakeManager.mintRewards(x.hsiStakeParams))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
      await expect(x.hsiStakeManager.withdrawableBalanceOf(x.hedron.address, signer1.address))
        .eventually.to.be.greaterThan(0)
    })
    it('anyone can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ])), false)
      const [, signerB] = x.signers
      await utils.moveForwardDays(10, x)
      await expect(x.hsiStakeManager.connect(signerB).mintRewards(x.hsiStakeParams))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
    })
    it('end deposited stakes', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const deposits = _.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ]))
      await expect(x.hsiStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30, x)
      // 30 day stake is in last
      await expect(x.hsiStakeManager.hsiStakeEndMany([x.hsiStakeParams[0]]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiStakeParams[0], anyUint)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeParams[0], anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiStakeParams[0], x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
    })
    it('end deposited stakes in any order', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const deposits = _.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 0]),
      ]))
      await expect(x.hsiStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(90, x)
      // 30 day stake is in last
      await expect(x.hsiStakeManager.hsiStakeEndMany(x.hsiStakeParams))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiStakeParams[0], anyUint)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiStakeParams[1], anyUint)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiStakeParams[2], anyUint)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeParams[0], anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiStakeParams[0], x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
    })
  })
  describe('setSettings', () => {
    it('sets settings', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [, signer2] = x.signers
      // give 10% of the yield to the end staker
      const encoded10Percent = (1n << 32n) | 10n
      const settings = {
        hedronTipMethod: 6,
        hedronTipMagnitude: encoded10Percent,
        tipMethod: 6,
        tipMagnitude: encoded10Percent,
        consentAbilities: parseInt('001111', 2),
        // unused on hsi
        newStakeDaysMethod: 0,
        newStakeDaysMagnitude: 0,
        newStakeMethod: 0,
        newStakeMagnitude: 0,
        copyIterations: 0,
      }
      const encodedSettings = await x.hsiStakeManager.encodeSettings(settings)
      const lastTokenId = x.hsiTokenIds[x.hsiTokenIds.length - 1]
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, tokenId === lastTokenId ? 0 : encodedSettings]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      const stake = await x.hex.stakeLists(x.hsiAddresses[0], 0)
      await expect(x.hsiStakeManager.stakeIdToSettings(stake.stakeId))
        .eventually.to.equal(encodedSettings)
      const lastHsiAddress = x.hsiAddresses[x.hsiAddresses.length - 1]
      const lastStake = await x.hex.stakeLists(lastHsiAddress, 0)
      await expect(x.hsiStakeManager.stakeIdToSettings(lastStake.stakeId))
        .eventually.to.equal(await x.hsiStakeManager.defaultEncodedSettings())
      const lastStakeIdSettings = await x.hsiStakeManager.stakeIdToSettings(lastStake.stakeId)
      const defaultSettings = await x.hsiStakeManager.defaultSettings()
      await expect(x.hsiStakeManager.decodeSettings(lastStakeIdSettings))
        .eventually.to.deep.equal(defaultSettings)
      await utils.moveForwardDays(30, x)
      const updatedSettings = {
        ...settings,
        tipMethod: 0,
        tipMagnitude: 0,
      }
      await expect(x.hsiStakeManager.connect(signer2).updateSettings(stake.stakeId, updatedSettings))
        .to.revertedWithCustomError(x.hsiStakeManager, 'StakeNotOwned')
        .withArgs(x.signers[1].address, x.signers[0].address)
      const encodedUpdatedSettings = await x.hsiStakeManager.encodeSettings(updatedSettings)
      await expect(x.hsiStakeManager.updateSettings(stake.stakeId, updatedSettings))
        .to.emit(x.hsiStakeManager, 'UpdateSettings')
        .withArgs(stake.stakeId, encodedUpdatedSettings)
        // this line is required
        // for some reason, the test fails without it
        .printGasUsage()

      await expect(x.hsiStakeManager.connect(signer2).hsiStakeEndMany([x.hsiAddresses[0]]))
        .to.emit(x.hex, 'StakeEnd')
    })
  })
})
