import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { fromStruct } from '../src/utils'
import { EncodableSettings } from "../artifacts/types"

describe('HSIStakeManager.sol', () => {
  describe('depositHsi', () => {
    it('can deposit hsis into the contract', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [
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
      const [signer1, signer2] = x.signers
      await expect(x.existingStakeManager.multicall(_.map(x.hsiTargets, (target) => (
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await expect(x.existingStakeManager.connect(signer2).withdrawHsi(x.hsiTargets[0].hsiAddress))
        .to.revertedWithCustomError(x.existingStakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.hsim.hsiCount(x.existingStakeManager.getAddress()))
        .eventually.to.equal(3)
      await expect(x.existingStakeManager.stakeIdInfo(x.hsiTargets[2].hsiAddress))
        .eventually.to.equal((2n << 160n) | BigInt(signer1.address)) // index 0
      await expect(x.existingStakeManager.withdrawHsi(x.hsiTargets[0].hsiAddress))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, x.hsiTargets[0].hsiAddress, await x.existingStakeManager.getAddress())
      await expect(x.existingStakeManager.stakeIdInfo(x.hsiTargets[2].hsiAddress))
        .eventually.to.equal(BigInt(signer1.address)) // index 0
      await expect(x.existingStakeManager.withdrawHsi(x.hsiTargets[1].hsiAddress))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, x.hsiTargets[1].hsiAddress, await x.existingStakeManager.getAddress())
      await expect(x.existingStakeManager.withdrawHsi(x.hsiTargets[2].hsiAddress))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, x.hsiTargets[2].hsiAddress, await x.existingStakeManager.getAddress())
    })
    it('can withdraw tips as well', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      const currencyIndex = await x.stakeManager.currencyListSize()
      const amount = hre.ethers.parseUnits('10', await x.usdc.decimals())
      const encodedLinear = await x.existingStakeManager.encodeLinear({
        method: 0,
        xFactor: 1,
        x: 1,
        yFactor: 0,
        y: 1,
        bFactor: 0,
        b: 0,
      })
      const tipSettings = await x.existingStakeManager.encodeTipSettings(false, currencyIndex, amount, encodedLinear)
      const stakeId = await x.existingStakeManager.hsiAddressToId(x.hsiTargets[0].hsiAddress)
      await utils.leechUsdc(amount, x.signers[0].address, x)
      await x.existingStakeManager.addCurrencyToList(x.usdc.getAddress())
      await x.usdc.approve(x.existingStakeManager.getAddress(), amount)
      await expect(x.existingStakeManager.depositAndAddTipToStake(false, x.usdc.getAddress(), stakeId, amount, encodedLinear))
        .to.revertedWithCustomError(x.existingStakeManager, 'StakeNotCustodied')
        .withArgs(stakeId)
      const encodedTip = await x.existingStakeManager.encodeTipSettings(
        false, currencyIndex,
        amount, encodedLinear
      )
      await expect(x.existingStakeManager.depositAndAddTipToStake(
        false, x.usdc.getAddress(),
        x.hsiTargets[0].hsiAddress, amount,
        encodedLinear,
      ))
        .to.emit(x.existingStakeManager, 'AddTip')
        .withArgs(x.hsiTargets[0].hsiAddress, await x.usdc.getAddress(), 0, encodedTip)

      await expect(x.existingStakeManager.withdrawHsi(x.hsiTargets[0].hsiAddress))
        .to.emit(x.existingStakeManager, 'RemoveTip')
        .withArgs(x.hsiTargets[0].hsiAddress, await x.usdc.getAddress(), 0, tipSettings)
        // .printGasUsage()
    })
  })
  describe('hsiCount', () => {
    it('returns the count of hsis deposited in the hsi stake manager', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsim.hsiCount(x.existingStakeManager.getAddress()))
        .eventually.to.equal(0)

      await expect(x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await expect(x.hsim.hsiCount(x.existingStakeManager.getAddress()))
        .eventually.to.equal(x.hsiTargets.length)
    })
  })
  describe('removeAllTips', () => {
    it('fails if not called by owner', async () => {
      // this test can also be done on regular stake manager
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      await expect(x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await expect(x.existingStakeManager.connect(signer2).removeAllTips(x.hsiTargets[0].hsiAddress))
        .to.revertedWithCustomError(x.existingStakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.existingStakeManager.removeAllTips(x.hsiTargets[0].hsiAddress))
        .not.to.reverted
    })
  })
  describe('createTo', () => {
    it('encodes a boolean and a value', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.createTo(hre.ethers.MaxUint256, signer1.address))
        .eventually.to.equal(1n << 160n | BigInt(signer1.address))
    })
  })
  describe('mintRewardsFromHSIAddress', () => {
    it('can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1] = x.signers
      await x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false)
      await utils.moveForwardDays(1n, x)
      await expect(x.existingStakeManager.mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress')))
        .not.to.emit(x.hedron, 'Transfer')
      await utils.moveForwardDays(10n, x)
      await expect(x.existingStakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signer1.address))
        .eventually.to.equal(0)
      await expect(x.existingStakeManager.mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
        // .printGasUsage()
      const withdrawable = await x.existingStakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signer1.address)
      expect(withdrawable).to.be.greaterThan(0)
      await utils.moveForwardDays(10n, x)
      const stakeId = x.hsiTargets[0].hsiAddress
      const currentSettings = await x.existingStakeManager.stakeIdToSettings(stakeId)
      const decodedSettings = await x.existingStakeManager.decodeSettings(currentSettings)
      // this tells system to send any remaining tokens to staker
      await Promise.all(x.hsiTargets.map(async ({ hsiAddress }) => (
        x.existingStakeManager.updateSettingsEncoded(hsiAddress, await x.existingStakeManager.encodeSettings({
          ...fromStruct(decodedSettings),
          consentAbilities: {
            ...fromStruct(decodedSettings.consentAbilities),
            shouldSendTokensToStaker: true,
          },
        }))
      )))
      const tx = await x.existingStakeManager.mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress'))
      await expect(x.existingStakeManager.withdrawableBalanceOf(x.hedron.getAddress(), signer1.address))
        .eventually.to.equal(withdrawable)
      expect(tx)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
      expect(tx)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(await x.existingStakeManager.getAddress(), signer1.address, anyUint)
      // extra mint in the same day
      await x.existingStakeManager.mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress'))
    })
    it('anyone can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const defaultEncodedSettings = await x.existingStakeManager.defaultEncodedSettings()
      await x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ])), false)
      const [, signerB] = x.signers
      await utils.moveForwardDays(10n, x)
      await expect(x.existingStakeManager.connect(signerB).mintHedronRewards(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
    })
    it('end deposited stakes', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const defaultEncodedSettings = await x.existingStakeManager.defaultEncodedSettings()
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ]))
      await expect(x.existingStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30n, x)
      // 30 day stake is in last
      const targetStakeIdAsHsi = x.hsiTargets[0]
      await expect(x.existingStakeManager.hsiStakeEndMany([targetStakeIdAsHsi.hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, targetStakeIdAsHsi.hsiAddress, targetStakeIdAsHsi.stakeId)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, targetStakeIdAsHsi.hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(targetStakeIdAsHsi.hsiAddress, await x.existingStakeManager.getAddress(), anyUint)
    })
    it('end deposited stakes and automatically attribute tips', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [, signer2] = x.signers
      const defaultEncodedSettings = await x.existingStakeManager.defaultEncodedSettings()
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ]))
      await expect(x.existingStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30n, x)
      // 30 day stake is in last
      const targetStakeIdAsHsi = x.hsiTargets[0]
      const tipAmount = x.oneEther / 100n
      await x.existingStakeManager.depositAndAddTipToStake(
        false,
        hre.ethers.ZeroAddress,
        targetStakeIdAsHsi.hsiAddress,
        tipAmount,
        0,
        {
          value: tipAmount,
        },
      )
      const tip = await x.existingStakeManager.stakeIdTips(targetStakeIdAsHsi.hsiAddress, 0)
      await expect(x.existingStakeManager.hsiStakeEndManyWithTipTo([targetStakeIdAsHsi.hsiAddress], signer2.address))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, targetStakeIdAsHsi.hsiAddress, targetStakeIdAsHsi.stakeId)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, targetStakeIdAsHsi.hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(targetStakeIdAsHsi.hsiAddress, await x.existingStakeManager.getAddress(), anyUint)
        .to.emit(x.existingStakeManager, 'Tip')
        .withArgs(
          x.hsiTargets[0].hsiAddress,
          hre.ethers.ZeroAddress,
          signer2.address,
          tipAmount
        )
      await expect(x.existingStakeManager.computeTip(tip))
        .eventually.to.deep.equal([tipAmount, tipAmount])
    })
    it('end deposited stakes in any order', async () => {
      const x = await loadFixture(utils.deployAndProcureSequentialDayHSIFixture)
      const defaultEncodedSettings = await x.existingStakeManager.defaultEncodedSettings()
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, defaultEncodedSettings]),
      ]))
      await expect(x.existingStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(90n, x)
      // 30 day stake is in last
      await expect(x.existingStakeManager.hsiStakeEndMany(_.map(x.hsiTargets, 'hsiAddress')))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[0].hsiAddress, x.hsiTargets[0].stakeId)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[1].hsiAddress, x.hsiTargets[1].stakeId)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[2].hsiAddress, x.hsiTargets[2].stakeId)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, x.hsiTargets[0].hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiTargets[0].hsiAddress, await x.existingStakeManager.getAddress(), anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
    })
  })
  const tenPercent = {
    // 5, 0, 1, 0, 10, 0, 0
    method: 2,
    xFactor: 1,
    x: 1,
    yFactor: 0,
    y: 10,
    bFactor: 0,
    b: 0,
  }
  const zeroLinear = {
    method: 0,
    xFactor: 0,
    x: 0,
    yFactor: 0,
    y: 0,
    bFactor: 0,
    b: 0,
  }
  describe('setSettings', () => {
    it('sets settings', async function () {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      // give 10% of the yield to the end staker
      const settings = {
        hedronTip: tenPercent,
        targetTip: tenPercent,
        newStake: zeroLinear,
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('001111', 2)).then(fromStruct),
        // unused on hsi
        newStakeDaysMethod: 0,
        newStakeDaysMagnitude: 0,
        copyIterations: 0,
        hasExternalTips: false,
      }
      const encodedSettings = await x.existingStakeManager.encodeSettings(settings)
      const firstStakeTarget = x.hsiTargets[0]
      const lastHsiTarget = x.hsiTargets[x.hsiTargets.length - 1]
      const defaultEncoded = await x.existingStakeManager.defaultEncodedSettings()
      await expect(x.existingStakeManager.multicall(_.map(x.hsiTargets, (target) => (
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [
          target.tokenId,
          target === lastHsiTarget ? defaultEncoded : encodedSettings,
        ])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
        // .printGasUsage()
      await expect(x.existingStakeManager.stakeIdToSettings(firstStakeTarget.hsiAddress))
        .eventually.to.equal(encodedSettings)
      // const lastStake = await x.hex.stakeLists(lastHsiTarget.hsiAddress, 0)
      await expect(x.existingStakeManager.stakeIdToSettings(lastHsiTarget.hsiAddress))
        .eventually.to.equal(defaultEncoded)
      const lastStakeIdSettings = await x.existingStakeManager.stakeIdToSettings(lastHsiTarget.hsiAddress)
      const defaultSettings = await x.existingStakeManager.defaultSettings()
      await expect(x.existingStakeManager.decodeSettings(lastStakeIdSettings))
        .eventually.to.deep.equal(defaultSettings)
      await utils.moveForwardDays(30n, x)
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        targetTip: zeroLinear,
      }
      const encodedUpdatedSettings = await x.existingStakeManager.encodeSettings(updatedSettings)
      await expect(x.existingStakeManager.connect(signer2).updateSettingsEncoded(firstStakeTarget.hsiAddress, encodedUpdatedSettings))
        .to.revertedWithCustomError(x.existingStakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
      await expect(x.existingStakeManager.updateSettingsEncoded(firstStakeTarget.hsiAddress, encodedUpdatedSettings))
        .to.emit(x.existingStakeManager, 'UpdateSettings')
        .withArgs(firstStakeTarget.hsiAddress, encodedUpdatedSettings)
        // this line is required
        // for some reason, the test fails without it
        // .printGasUsage()

      await expect(x.existingStakeManager.connect(signer2).hsiStakeEndMany([firstStakeTarget.hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, firstStakeTarget.hsiAddress, firstStakeTarget.stakeId)
      await utils.moveForwardDays(30n, x)
      // mints hedron rewards before hsi is ended so that we have a case
      // where 0 is the amount
      await expect(x.existingStakeManager.mintHedronRewards([x.hsiTargets[1].hsiAddress]))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
      await expect(x.existingStakeManager.connect(signer2).hsiStakeEndMany([x.hsiTargets[1].hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[1].hsiAddress, x.hsiTargets[1].stakeId)
    })
  })
  describe('restarting hsis', async () => {
    it('will restart an hsi with the appropriate inputs', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      const settings = {
        hedronTip: zeroLinear,
        targetTip: zeroLinear,
        newStake: {
          ...zeroLinear,
          method: 2,
        },
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('001101', 2)).then(fromStruct),
        // unused on hsi
        newStakeDaysMethod: 2,
        newStakeDaysMagnitude: 0,
        copyIterations: 0,
        hasExternalTips: false,
      }
      const encodedSettings = await x.stakeManager.encodeSettings(settings)
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, encodedSettings]),
      ]))
      await expect(x.existingStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30n, x)
      const nextStakeId = await utils.nextStakeId(x.hex)
      await expect(x.existingStakeManager.connect(signer2).hsiStakeEndMany([x.hsiTargets[0].hsiAddress]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[0].hsiAddress, x.hsiTargets[0].stakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, anyValue, nextStakeId)
    })
    it('will ignore hsis that do not exist', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1, signer2] = x.signers
      const settings = {
        hedronTip: zeroLinear,
        targetTip: zeroLinear,
        newStake: {
          ...zeroLinear,
          method: 2,
        },
        consentAbilities: await x.stakeManager.decodeConsentAbilities(parseInt('001101', 2)).then(fromStruct),
        // unused on hsi
        newStakeDaysMethod: 2,
        newStakeDaysMagnitude: 0,
        copyIterations: 0,
        hasExternalTips: false,
      }
      const encodedSettings = await x.stakeManager.encodeSettings(settings)
      const deposits = _.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, encodedSettings]),
      ]))
      await expect(x.existingStakeManager.multicall(deposits, false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30n, x)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const hsiEndMany = x.existingStakeManager.connect(signer2).hsiStakeEndMany([
        x.hsiTargets[0].hsiAddress,
        signer1.address, // invalid hsi addresses are ignored
      ])
      await expect(hsiEndMany)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.hsiTargets[0].hsiAddress, x.hsiTargets[0].stakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, anyValue, nextStakeId)
      const hsiAddress = await utils.receiptToHsiAddress(x.hsim, await hsiEndMany)
      await expect(x.existingStakeManager.withdrawHsi(hsiAddress))
        .to.emit(x.hsim, 'HSITokenize')
        .withArgs(anyUint, anyUint, hsiAddress, await x.existingStakeManager.getAddress())
        .to.emit(x.hsim, 'Transfer') // mint
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
        .to.emit(x.hsim, 'Transfer') // transfer to tracked owner
        .withArgs(await x.existingStakeManager.getAddress(), signer1.address, anyUint)
    })
  })
  describe('restarting', () => {
    it('can restart stakes', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1] = x.signers
      await expect(x.existingStakeManager.multicall(_.map(x.hsiTargets, (target) => (
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30n, x)
      // 30 day stake is in last
      const targetStakeIdAsHsi = x.hsiTargets[0]
      const nextStakeId = await utils.nextStakeId(x.hex)
      const hsiRestart = x.existingStakeManager.stakeRestartById(targetStakeIdAsHsi.hsiAddress)
      await expect(hsiRestart)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, targetStakeIdAsHsi.hsiAddress, targetStakeIdAsHsi.stakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, anyValue, nextStakeId)
      const restartedHsiAddress = await utils.receiptToHsiAddress(x.hsim, await hsiRestart)
      await expect(x.existingStakeManager.withdrawHsi(restartedHsiAddress))
        .to.emit(x.hsim, 'HSITokenize') // mint
        .withArgs(anyUint, anyUint, restartedHsiAddress, await x.existingStakeManager.getAddress())
        .to.emit(x.hsim, 'Transfer') // mint
        .withArgs(hre.ethers.ZeroAddress, await x.existingStakeManager.getAddress(), anyUint)
        .to.emit(x.hsim, 'Transfer') // transfer to tracked owner
        .withArgs(await x.existingStakeManager.getAddress(), signer1.address, anyUint)
    })
  })
})
