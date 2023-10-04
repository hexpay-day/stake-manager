import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import * as utils from './utils'
import { expect } from "chai"
import * as hre from 'hardhat'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"
import { fromStruct } from '../src/utils'

describe('TransferableStakeManager.sol', () => {
  let x!: Awaited<ReturnType<typeof utils.deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(utils.deployFixture)
  })
  describe('removeTransferrability', () => {
    it('removes the transferable flag', async () => {
      const days = 3
      const [signer1] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings = {
        ...fromStruct(settings),
        consentAbilities: {
          ...fromStruct(settings.consentAbilities),
          canStakeEnd: true,
          canEarlyStakeEnd: true,
          canMintHedron: true,
          canMintHedronAtEnd: true,
          shouldSendTokensToStaker: true,
          stakeIsTransferable: true,
          copyExternalTips: true,
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      const removedEncoded = await x.stakeManager.removeTransferrabilityFromEncodedSettings(encodedSettings)
      await expect(x.stakeManager.removeTransferrability(x.nextStakeId))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(x.nextStakeId, removedEncoded)
      await expect(x.stakeManager.isOneAtIndex(removedEncoded, 5))
        .eventually.to.be.false
      await expect(x.stakeManager.isOneAtIndex(removedEncoded, 6))
        .eventually.to.be.true
      await expect(x.stakeManager.isOneAtIndex(removedEncoded, 4))
        .eventually.to.be.true
    })
  })
  describe('stakeTransfer', () => {
    it('allows for a transfer', async () => {
      const days = 3n
      const [signer1, signer2, signer3] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const decodedSettings: EncodableSettings.SettingsStructOutput = {
        ...fromStruct(settings),
        newStakeDaysMethod: 0n,
        consentAbilities: {
          ...fromStruct(settings.consentAbilities),
          stakeIsTransferable: true,
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(decodedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, signer2.address))
        .to.emit(x.stakeManager, 'TransferStake')
        .withArgs(signer1.address, signer2.address, x.nextStakeId)
      await expect(x.stakeManager.canTransfer(x.nextStakeId))
        .eventually.to.equal(true)
      await expect(x.stakeManager.connect(signer2).removeTransferrability(x.nextStakeId))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(x.nextStakeId, await x.stakeManager.removeTransferrabilityFromEncodedSettings(encodedSettings))
      await expect(x.stakeManager.connect(signer2).stakeTransfer(x.nextStakeId, signer1.address))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await utils.moveForwardDays(days + 1n, x)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.getAddress(), signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeEndByConsent(x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, await x.stakeManager.getAddress(), x.nextStakeId)
        .to.emit(x.hex20, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.getAddress(), signer2.address))
        .eventually.to.be.greaterThan(0)
    })
    it('brings tips along', async () => {
      const days = 3
      const [signer1, signer2, signer3] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const decodedSettings: EncodableSettings.SettingsStructOutput = {
        ...fromStruct(settings),
        newStakeDaysMethod: 0n,
        consentAbilities: {
          ...fromStruct(settings.consentAbilities),
          stakeIsTransferable: true,
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(decodedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.depositAndAddTipToStake(
        true,
        hre.ethers.ZeroAddress,
        x.nextStakeId,
        x.stakedAmount / 100n,
        0,
        {
          value: x.stakedAmount / 100n,
        },
      ))
        .to.emit(x.stakeManager, 'AddTip')
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, signer2.address))
        .to.emit(x.stakeManager, 'TransferStake')
      await expect(x.stakeManager.connect(signer2).removeAllTips(x.nextStakeId))
        .to.emit(x.stakeManager, 'RemoveTip')
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.ZeroAddress, signer2.address))
        .eventually.to.equal(x.stakedAmount / 100n)
    })
  })
  describe('transfer receivership', () => {
    let transferableSettings!: bigint
    let stakeStartArgs!: [string, bigint, number, bigint]
    beforeEach(async () => {
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...fromStruct(settings),
        consentAbilities: {
          ...fromStruct(settings.consentAbilities),
          stakeIsTransferable: true,
        },
      }
      const encodedsettings = await x.stakeManager.encodeSettings(updatedSettings)
      transferableSettings = encodedsettings
      const [signer1] = x.signers
      stakeStartArgs = [signer1.address, x.oneMillion / 10n, 1, transferableSettings]
    })
    it('can call onStakeReceived on eoa', async () => {
      const [signer1, signer2] = x.signers
      await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, signer2.address))
        .to.emit(x.stakeManager, 'TransferStake')
        .withArgs(signer1.address, signer2.address, x.nextStakeId)
    })
    it('can call onStakeReceived on a contract', async () => {
      const [signer1] = x.signers
      await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.getAddress()))
        .to.emit(x.stakeManager, 'TransferStake')
        .withArgs(signer1.address, await x.transferReceiver.getAddress(), x.nextStakeId)
        .to.emit(x.transferReceiver, 'StakeReceived')
        .withArgs(signer1.address, x.nextStakeId)
    })
    describe('failures', () => {
      it('can bubble up empty errors', async () => {
        await x.transferReceiver.setReceiveAction(1)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.getAddress()))
          .to.revertedWithoutReason()
      })
      it('can bubble up string errors', async () => {
        await x.transferReceiver.setReceiveAction(2)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.getAddress()))
          .to.revertedWith('Failed to receive')
      })
      it('can bubble up custom errors', async () => {
        await x.transferReceiver.setReceiveAction(3)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.getAddress()))
          .to.revertedWithCustomError(x.transferReceiver, 'FailedToReceive')
          .withArgs(x.nextStakeId)
      })
      it('can bubble up panic errors', async () => {
        await x.transferReceiver.setReceiveAction(4)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.getAddress()))
          .to.revertedWithPanic(50) // array index out of bounds
      })
    })
  })
})
