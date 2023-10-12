import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import { deployFixture } from './utils'
import * as utils from '../src/utils'
import _ from 'lodash'
import { EncodableSettings } from "../artifacts/types"

describe('EncodableSettings.sol', () => {
  let x!: Awaited<ReturnType<typeof deployFixture>>
  beforeEach(async () => {
    x = await loadFixture(deployFixture)
  })
  describe('default methods', () => {
    it('should match', async () => {
      const defaultEncodedSettings = await x.stakeManager.defaultEncodedSettings()
      const decodedSettings = await x.stakeManager.decodeSettings(defaultEncodedSettings)
      await expect(x.stakeManager.defaultSettings())
        .eventually.to.deep.equal(decodedSettings)
    })
  })
  describe('stakeIdSettings', () => {
    it('provides decoded settings', async () => {
      let settings = utils.fromStruct(await x.stakeManager.stakeIdSettings(0));
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
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, defaultSettings)
      settings = await x.stakeManager.defaultSettings()
      await expect(x.stakeManager.stakeIdSettings(x.nextStakeId))
        .eventually.to.deep.equal(settings)
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
      const encoded = await x.stakeManager.encodeConsentAbilities(abilities)
      await expect(x.stakeManager.isOneAtIndex(encoded, 7)).eventually.to.equal(false)
      await expect(x.stakeManager.isOneAtIndex(encoded, 6)).eventually.to.equal(true)
      await expect(x.stakeManager.isOneAtIndex(encoded, 5)).eventually.to.equal(false)
      await expect(x.stakeManager.isOneAtIndex(encoded, 4)).eventually.to.equal(true)
      await expect(x.stakeManager.isOneAtIndex(encoded, 3)).eventually.to.equal(false)
      await expect(x.stakeManager.isOneAtIndex(encoded, 2)).eventually.to.equal(true)
      await expect(x.stakeManager.isOneAtIndex(encoded, 1)).eventually.to.equal(false)
      await expect(x.stakeManager.isOneAtIndex(encoded, 0)).eventually.to.equal(true)
      await expect(x.stakeManager.decodeConsentAbilities(encoded).then(utils.fromStruct))
        .eventually.to.deep.equal(abilities)
    })
    it('can be all true or false', async () => {
      const decodedZero = utils.fromStruct(await x.stakeManager.decodeConsentAbilities(0))
      const decodedEff = utils.fromStruct(await x.stakeManager.decodeConsentAbilities('0xff'))
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
      await expect(x.stakeManager.encodeConsentAbilities(decodedZero))
        .eventually.to.equal(0)
      await expect(x.stakeManager.encodeConsentAbilities(decodedEff))
        .eventually.to.equal(BigInt('0xff'))
    })
  })
  describe('updateSettingsEncoded', () => {
    it('can update settings', async () => {
      const [signer1] = x.signers
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 1, 0)
      await expect(x.stakeManager.updateSettingsEncoded(x.nextStakeId, hre.ethers.MaxUint256))
        .to.emit(x.stakeManager, 'UpdateSettings')
      await x.stakeManager.stakeIdToSettings(x.nextStakeId)
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
