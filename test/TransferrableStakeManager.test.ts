import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import * as utils from './utils'
import { expect } from "chai"
import * as hre from 'hardhat'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"

describe('TransferrableStakeManager.sol', () => {
  const updateSettings = (settings: bigint, value: bigint) => {
    return settings >> 6n << 6n | BigInt.asUintN(5, settings) | value
  }
  describe('removeTransferrability', () => {
    it('removes the transferrable flag', async () => {
      const x = await loadFixture(utils.deployFixture)
      const days = 3
      const [signer1] = x.signers
      const encodedSettings = await x.stakeManager.defaultEncodedSettings()
      const hasTransferability = updateSettings(encodedSettings.toBigInt(), 1n)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, hasTransferability))
        .to.emit(x.hex, 'StakeStart')
      await x.stakeManager.removeTransferrability(x.nextStakeId)
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
        newStakeDaysMethod: 0,
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
        .withArgs(x.nextStakeId, updateSettings(encodedSettings.toBigInt(), 0n))
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
