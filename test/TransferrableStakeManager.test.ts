import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import * as utils from './utils'
import { expect } from "chai"
import * as hre from 'hardhat'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { EncodableSettings } from "../artifacts/types"

describe('TransferrableStakeManager.sol', () => {
  describe('allowTransferrability', () => {
    it('adds a transferrable flag', async () => {
      const x = await loadFixture(utils.deployFixture)
      const days = 3
      const [signer1] = x.signers
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0))
        .to.emit(x.hex, 'StakeStart')
      const encodedSettings = await x.stakeManager.stakeIdToSettings(x.nextStakeId)
      await expect(x.stakeManager.allowTransferrability(x.nextStakeId))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(x.nextStakeId, encodedSettings.toBigInt() | (1n << 5n))
    })
  })
  describe('removeTransferrability', () => {
    it('adds a transferrable flag', async () => {
      const x = await loadFixture(utils.deployFixture)
      const days = 3
      const [signer1] = x.signers
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, 0))
        .to.emit(x.hex, 'StakeStart')
      await x.stakeManager.allowTransferrability(x.nextStakeId)
      const _encodedSettings = await x.stakeManager.stakeIdToSettings(x.nextStakeId)
      const encodedSettings = _encodedSettings.toBigInt()
      const removedAbility = encodedSettings >> 6n << 6n | BigInt.asUintN(5, encodedSettings)
      await expect(x.stakeManager.removeTransferrability(x.nextStakeId))
        .to.emit(x.stakeManager, 'UpdateSettings')
        .withArgs(x.nextStakeId, removedAbility)
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
        },
      }
      const encodedSettings = await x.stakeManager.encodeSettings(decodedSettings)
      await expect(x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, encodedSettings))
        .to.emit(x.hex, 'StakeStart')
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, signer2.address))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await x.stakeManager.allowTransferrability(x.nextStakeId)
      await expect(x.stakeManager.stakeTransfer(x.nextStakeId, signer2.address))
        .to.emit(x.stakeManager, 'TransferStake')
        .withArgs(x.nextStakeId, signer2.address)
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
