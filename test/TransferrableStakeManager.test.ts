import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import * as utils from './utils'
import { expect } from "chai"
import * as hre from 'hardhat'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"

describe('TransferrableStakeManager.sol', () => {
  describe('removeTransferrability', () => {
    it('removes the transferrable flag', async () => {
      const x = await loadFixture(utils.deployFixture)
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
      const x = await loadFixture(utils.deployFixture)
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
        .withArgs(x.nextStakeId, signer2.address)
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
  })
})
