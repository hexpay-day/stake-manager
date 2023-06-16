import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

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
    it('provides info on authorization', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signerA, signerB] = x.signers
      await expect(x.isolatedStakeManager.isAddressAuthorized(signerA.address, 2))
        .eventually.to.equal(true)
      await expect(x.isolatedStakeManager.isAddressAuthorized(signerB.address, 2))
        .eventually.to.equal(false)
      await x.isolatedStakeManager.setAuthorization(signerB.address, 4)
      await expect(x.isolatedStakeManager.isAddressAuthorized(signerB.address, 2))
        .eventually.to.equal(true)
    })
  })
  describe('stakeStart', () => {
    it('starts stakes', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer] = x.signers
      const tx = x.isolatedStakeManager.stakeStart(x.oneMillion, 30)
      await expect(tx)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.isolatedStakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer.address, x.isolatedStakeManager.address, x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.isolatedStakeManager.address, hre.ethers.constants.AddressZero, x.oneMillion)
      await expect(tx)
        .changeTokenBalances(x.hex,
          [signer, x.isolatedStakeManager],
          [x.oneMillion * -1n, 0],
        )
    })
    it('can start stakes from tokens already in the manager', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer] = x.signers
      const stakeAmount = 1_000n * (10n**BigInt(x.decimals))
      const tx = x.hex.connect(signer).transfer(x.isolatedStakeManager.address, stakeAmount)
      await expect(tx)
        .changeTokenBalances(x.hex,
          [signer, x.isolatedStakeManager],
          [stakeAmount * -1n, stakeAmount],
        )
      await expect(x.isolatedStakeManager.stakeStart(0, 30))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.isolatedStakeManager.address, x.nextStakeId)
    })
  })
  describe('stakeEnd', () => {
    it('ends stakes', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signer] = x.signers
      const balanceBefore = await x.hex.balanceOf(signer.address)
      const tx = x.isolatedStakeManager.stakeEnd(0, x.nextStakeId)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, x.nextStakeId)
      const owner = await x.isolatedStakeManager.owner()
      const ownerDelta = (await x.hex.balanceOf(owner)).sub(balanceBefore).toBigInt()
      await expect(tx)
        .changeTokenBalances(x.hex,
          [owner, x.isolatedStakeManager.address],
          [ownerDelta, 0],
        )
      expect(ownerDelta).to.be.greaterThan(x.stakedAmount)
    })
  })
  describe('checkAndEndStake', () => {
    it('only ends the stake if the stake id matches', async () => {
      // this test shows that external enders can be assured that their
      // multicall(s) will not fail if the have the wrong data
      const x = await loadFixture(utils.stakeBagAndWait)
      const skipped = x.isolatedStakeManager.checkAndStakeEnd(0, x.nextStakeId + 1n)
      await expect(skipped).not.to.rejected
      const tx = await skipped
      const receipt = await tx.wait()
      expect(receipt.logs).to.deep.equal([])
      const successful = x.isolatedStakeManager.checkAndStakeEnd(0, x.nextStakeId)
      await expect(successful)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, x.nextStakeId)
    })
  })
})
