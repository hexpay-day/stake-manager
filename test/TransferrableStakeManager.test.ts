import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import * as utils from './utils'
import { expect } from "chai"
import * as hre from 'hardhat'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"

describe('TransferrableStakeManager.sol', () => {
  let x!: Awaited<ReturnType<typeof utils.deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(utils.deployFixture)
  })
  describe('removeTransferrability', () => {
    it('removes the transferrable flag', async () => {
      const days = 3
      const [signer1] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings = {
        ...settings,
        consentAbilities: {
          ...settings.consentAbilities,
          canStakeEnd: true,
          canEarlyStakeEnd: true,
          canMintHedron: true,
          canMintHedronAtEnd: true,
          shouldSendTokensToStaker: true,
          stakeIsTransferrable: true,
          copyExternalTips: true,
          // hasExternalTips: true, // controlled by contract
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(updatedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      const removedEncoded = await x.stakeManager.removeTransferrabilityFromEncodedSettings(encodedSettings.toBigInt())
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
      const days = 3
      const [signer1, signer2, signer3] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const decodedSettings: EncodableSettings.SettingsStructOutput = {
        ...settings,
        newStakeDaysMethod: hre.ethers.BigNumber.from(0),
        consentAbilities: {
          ...settings.consentAbilities,
          stakeIsTransferrable: true,
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
        .withArgs(x.nextStakeId, await x.stakeManager.removeTransferrabilityFromEncodedSettings(encodedSettings.toBigInt()))
      await expect(x.stakeManager.connect(signer2).stakeTransfer(x.nextStakeId, signer1.address))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await utils.moveForwardDays(days + 1, x)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.stakeEndByConsent(x.nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, anyUint)
      await expect(x.stakeManager.withdrawableBalanceOf(x.hex.address, signer2.address))
        .eventually.to.be.greaterThan(0)
    })
    it('brings tips along', async () => {
      const days = 3
      const [signer1, signer2, signer3] = x.signers
      const settings = await x.stakeManager.defaultSettings()
      const decodedSettings: EncodableSettings.SettingsStructOutput = {
        ...settings,
        newStakeDaysMethod: hre.ethers.BigNumber.from(0),
        consentAbilities: {
          ...settings.consentAbilities,
          stakeIsTransferrable: true,
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(decodedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.depositAndAddTipToStake(
        true,
        hre.ethers.constants.AddressZero,
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
      await expect(x.stakeManager.withdrawableBalanceOf(hre.ethers.constants.AddressZero, signer2.address))
        .eventually.to.equal(x.stakedAmount / 100n)
    })
  })
  describe('transfer receivership', () => {
    let transferrableSettings!: bigint
    let stakeStartArgs!: [string, bigint, number, bigint]
    beforeEach(async () => {
      const settings = await x.stakeManager.defaultSettings()
      const updatedSettings: EncodableSettings.SettingsStruct = {
        ...settings,
        consentAbilities: {
          ...settings.consentAbilities,
          stakeIsTransferrable: true,
        },
      }
      const encodedsettings = await x.stakeManager.encodeSettings(updatedSettings)
      transferrableSettings = encodedsettings.toBigInt()
      const [signer1] = x.signers
      stakeStartArgs = [signer1.address, x.oneMillion / 10n, 1, transferrableSettings]
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
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.address))
        .to.emit(x.stakeManager, 'TransferStake')
        .withArgs(signer1.address, x.transferReceiver.address, x.nextStakeId)
        .to.emit(x.transferReceiver, 'StakeReceived')
        .withArgs(signer1.address, x.nextStakeId)
    })
    describe('failures', () => {
      it('can bubble up empty errors', async () => {
        await x.transferReceiver.setReceiveAction(1)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.address))
          .to.revertedWithoutReason()
      })
      it('can bubble up string errors', async () => {
        await x.transferReceiver.setReceiveAction(2)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.address))
          .to.revertedWith('Failed to receive')
      })
      it('can bubble up custom errors', async () => {
        await x.transferReceiver.setReceiveAction(3)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.address))
          .to.revertedWithCustomError(x.transferReceiver, 'FailedToReceive')
          .withArgs(x.nextStakeId)
      })
      it('can bubble up panic errors', async () => {
        await x.transferReceiver.setReceiveAction(4)
        await expect(x.stakeManager.stakeStartFromBalanceFor(...stakeStartArgs))
          .to.emit(x.hex, 'StakeStart')
        await expect(x.stakeManager.stakeTransfer(x.nextStakeId, x.transferReceiver.address))
          .to.revertedWithPanic(50) // array index out of bounds
      })
    })
  })
})
