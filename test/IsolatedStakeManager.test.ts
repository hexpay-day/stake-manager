import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'

describe('IsolatedStakeManager.sol', () => {
  describe('state', () => {
    it('knows what to target', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.isolatedStakeManager.target())
        .eventually.to.equal(utils.hexAddress)
    })
  })
  describe('ownership', () => {
    it('is owned by the signer', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signerA] = x.signers
      await expect(x.isolatedStakeManager.owner())
        .eventually.to.equal(signerA.address)
    })
    it('follows the Ownable2Step for transferring ownership', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signerA, signerB] = x.signers
      await expect(x.isolatedStakeManager.transferOwnership(signerB.address))
        .to.emit(x.isolatedStakeManager, 'OwnershipTransferStarted')
        .withArgs(signerA.address, signerB.address)
      await expect(x.isolatedStakeManager.connect(signerB).acceptOwnership())
        .to.emit(x.isolatedStakeManager, 'OwnershipTransferred')
        .withArgs(signerA.address, signerB.address)
    })
  })
  describe('authorization', () => {
    it('authorizes the owner by default', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signerA] = x.signers
      // const bytes32 = hre.ethers.utils.hexZeroPad(signerA.address, 32)
      // console.log(bytes32)
      await expect(x.isolatedStakeManager.authorization(hre.ethers.utils.hexZeroPad(signerA.address, 32)))
        .eventually.to.equal(await x.isolatedStakeManager.MAX_AUTHORIZATION())
    })
    it('can add authorization to more addresses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      const signerBKey = utils.addressToBytes32(signerB)
      await expect(x.isolatedStakeManager.authorization(signerBKey))
        .eventually.to.equal(0)
      await expect(x.isolatedStakeManager.setAuthorization(signerB.address, 5))
        .to.emit(x.isolatedStakeManager, 'UpdateAuthorization')
        .withArgs(signerBKey, 5)
      await expect(x.isolatedStakeManager.authorization(signerBKey))
        .eventually.to.equal(5)
    })
    it('only owner can add authorizations', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManager.connect(signerB).setAuthorization(signerB.address, 5))
        .eventually.to.rejectedWith('Ownable: caller is not the owner')
    })
  })
})