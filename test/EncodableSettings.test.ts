import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import { deployFixture } from './utils'
import * as utils from '../src/utils'
import _ from 'lodash'

describe('EncodableSettings.sol', () => {
  let x!: Awaited<ReturnType<typeof deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(deployFixture)
  })
  describe('default methods', () => {
    it('should match', async () => {
      const defaultSettings = await x.stakeManager.defaultSettings()
      expect(defaultSettings)
        .to.deep.equal(utils.settings.encode(
          utils.settings.decode(defaultSettings)
        ))
    })
  })
  describe('stakeIdToSettings', () => {
    it('provides decoded settings', async () => {
      let settings = await x.stakeManager.stakeIdToSettings(0)
        .then(utils.settings.decode)
      expect(settings.newStake.method).to.equal(0)
      expect(settings.newStake.xFactor).to.equal(0)
      expect(settings.newStake.x).to.equal(0)
      expect(settings.newStake.yFactor).to.equal(0)
      expect(settings.newStake.y).to.equal(0)
      expect(settings.newStake.bFactor).to.equal(0)
      expect(settings.newStake.b).to.equal(0)
      expect(settings.newStakeDaysMagnitude).to.equal(0)
      expect(settings.newStakeDaysMethod).to.equal(0)
      const [signer1] = x.signers
      const defaultSettings = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.stakeIdToSettings(x.nextStakeId))
        .eventually.to.equal(0)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, defaultSettings)
      await expect(x.stakeManager.stakeIdToSettings(x.nextStakeId))
        .eventually.to.equal(defaultSettings)
    })
  })
  describe('encode/decodeConsentAbilities', () => {
    it('can encode and decode consent abilities', async () => {
      const abilities = {
        mintCommunisAtEnd: false,
        copyExternalTips: true,
        stakeIsTransferable: false,
        shouldSendTokensToStaker: true,
        canMintHedronAtEnd: false,
        canMintHedron: true,
        canEarlyStakeEnd: false,
        canStakeEnd: true,
      }
      const encoded = utils.consentAbilities.encode(abilities)
      expect(utils.isOneAtIndex(encoded, 7)).to.equal(false)
      expect(utils.isOneAtIndex(encoded, 6)).to.equal(true)
      expect(utils.isOneAtIndex(encoded, 5)).to.equal(false)
      expect(utils.isOneAtIndex(encoded, 4)).to.equal(true)
      expect(utils.isOneAtIndex(encoded, 3)).to.equal(false)
      expect(utils.isOneAtIndex(encoded, 2)).to.equal(true)
      expect(utils.isOneAtIndex(encoded, 1)).to.equal(false)
      expect(utils.isOneAtIndex(encoded, 0)).to.equal(true)
    })
    it('can be all true or false', async () => {
      const decodedZero = utils.consentAbilities.decode(BigInt(0))
      const decodedEff = utils.consentAbilities.decode(BigInt('0xff'))
      expect(decodedZero)
        .to.deep.equal({
          canStakeEnd: false,
          canEarlyStakeEnd: false,
          canMintHedron: false,
          canMintHedronAtEnd: false,
          shouldSendTokensToStaker: false,
          stakeIsTransferable: false,
          copyExternalTips: false,
          mintCommunisAtEnd: false,
        })
      expect(decodedEff)
        .to.deep.equal({
          canStakeEnd: true,
          canEarlyStakeEnd: true,
          canMintHedron: true,
          canMintHedronAtEnd: true,
          shouldSendTokensToStaker: true,
          stakeIsTransferable: true,
          copyExternalTips: true,
          mintCommunisAtEnd: true,
        })
      expect(utils.consentAbilities.encode(decodedZero)).to.equal(0)
      expect(utils.consentAbilities.encode(decodedEff)).to.equal(BigInt('0xff'))
    })
  })
  describe('updateSettingsEncoded', () => {
    it('can update settings', async () => {
      const [signer1] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, 0)
      await expect(x.stakeManager.updateSettings(x.nextStakeId, hre.ethers.MaxUint256))
        .to.emit(x.stakeManager, 'UpdateSettings')
    })
  })
  describe('decrementCopyIterations', () => {
    it('returns 0 if 0 is passed (in the second byte)', async () => {
      // settings (uint256) is provided to decrement copy iterations
      await expect(x.stakeManager.decrementCopyIterations(0))
        .eventually.to.equal(0)
    })
    it('preserves number in first byte', async () => {
      // settings (uint256) is provided to decrement copy iterations
      await expect(x.stakeManager.decrementCopyIterations(240n))
        .eventually.to.equal(240n)
    })
    it('returns 127 if 127 is passed (in the second byte)', async () => {
      await expect(x.stakeManager.decrementCopyIterations(127n << 9n))
        .eventually.to.equal(127n << 9n)
    })
    it('any number less than 255 in the second byte is decremented', async () => {
      await expect(x.stakeManager.decrementCopyIterations(126n << 9n))
        .eventually.to.equal(125n << 9n)
    })
    it('preserves numbers above the second byte', async () => {
      await expect(x.stakeManager.decrementCopyIterations(123n << 16n | 126n << 9n))
        .eventually.to.equal(123n << 16n | 125n << 9n)
    })
  })
})
