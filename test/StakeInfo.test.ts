import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as utils from './utils'

describe('StakeInfo.sol', () => {
  describe('verifyStakeOwnership', () => {
    it('errs if one is not the stake owner', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.verifyStakeOwnership(hre.ethers.ZeroAddress, 1))
        .not.to.be.reverted
    })
    it('errs if no one owns a stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.verifyStakeOwnership(signer1.address, 1))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer1.address, hre.ethers.ZeroAddress)
    })
    it('errs if not the owner of a stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      await x.stakeManager.stakeStart(x.oneMillion, 1)
      await expect(x.stakeManager.verifyStakeOwnership(signer2.address, x.nextStakeId))
        .to.revertedWithCustomError(x.stakeManager, 'StakeNotOwned')
        .withArgs(signer2.address, signer1.address)
    })
    it('resolves if owner of stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await x.stakeManager.stakeStart(x.oneMillion, 1)
      await expect(x.stakeManager.verifyStakeOwnership(signer1.address, x.nextStakeId))
        .not.to.be.reverted
    })
  })
  describe('verifyCustodian', () => {
    it('errs if the contract is not the custodian of a provided stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.verifyCustodian(1))
        .to.be.revertedWithCustomError(x.stakeManager, 'StakeNotCustodied')
        .withArgs(1)
    })
    it('does not err if the stake is custodied by the contract', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.oneMillion, 1)
      await expect(x.stakeManager.verifyCustodian(x.nextStakeId))
        .not.to.reverted
    })
    it('also is true if hsi is owned (registered by address)', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false)
      await expect(x.existingStakeManager.verifyCustodian(x.hsiTargets[0].hsiAddress))
        .not.to.reverted
    })
  })
  describe('stakeIdToInfo', () => {
    it('stake info is registered under id', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      const stakeIndex = await x.hex.stakeCount(x.stakeManager.getAddress())
      await x.stakeManager.stakeStart(x.oneMillion, 1)
      await expect(x.stakeManager.stakeIdToInfo(x.nextStakeId))
        .eventually.to.be.deep.equal([stakeIndex, signer1.address])
    })
    it('stake info is registered under hsi address', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signer1] = x.signers
      await x.existingStakeManager.multicall(_.flatMap(x.hsiTargets, (target) => ([
        x.existingStakeManager.interface.encodeFunctionData('depositHsi', [target.tokenId, 0]),
      ])), false)
      expect(x.hsiTargets[0].hsiIndex).to.equal(0n)
      expect(x.hsiTargets[1].hsiIndex).to.equal(1n)
      expect(x.hsiTargets[2].hsiIndex).to.equal(2n)
      await expect(x.existingStakeManager.stakeIdToInfo(x.hsiTargets[0].hsiAddress))
        .eventually.to.be.deep.equal([x.hsiTargets[0].hsiIndex, signer1.address])
      await expect(x.existingStakeManager.stakeIdToInfo(x.hsiTargets[1].hsiAddress))
        .eventually.to.be.deep.equal([x.hsiTargets[1].hsiIndex, signer1.address])
      await expect(x.existingStakeManager.stakeIdToInfo(x.hsiTargets[2].hsiAddress))
        .eventually.to.be.deep.equal([x.hsiTargets[2].hsiIndex, signer1.address])
    })
  })
  describe('encodeInfo', () => {
    it('can encode info that would be stored on the stakeIdToInfo mapping', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.encodeInfo(1000n, signer1.address))
        .eventually.to.equal((1000n << 160n) | BigInt(signer1.address))
    })
  })
})
