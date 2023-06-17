import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

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
  describe('instance creation', () => {
    it('creates isolated stake managers for provided addresses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManagerFactory.isolatedStakeManagers(signerB.address))
        .eventually.to.equal(hre.ethers.constants.AddressZero)
      // this method is being run by signerA
      await expect(x.isolatedStakeManagerFactory.createIsolatedManager(signerB.address))
        .to.emit(x.isolatedStakeManagerFactory, 'CreateIsolatedStakeManager')
        .withArgs(signerB.address, anyValue)
      await expect(x.isolatedStakeManagerFactory.createIsolatedManager(signerB.address))
        .not.to.be.rejected
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
    it('cannot provide a value greater than the max', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManager.MAX_AUTHORIZATION())
        .eventually.to.equal(31)
      await expect(x.isolatedStakeManager.setAuthorization(signerB.address, 32))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
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
      const [nextStakeId] = x.stakeIds
      const balanceBefore = await x.hex.balanceOf(x.isolatedStakeManager.address)
      const tx = x.isolatedStakeManager.stakeEnd(0, nextStakeId)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, nextStakeId)
      const owner = await x.isolatedStakeManager.owner()
      const contractHoldings = (await x.hex.balanceOf(x.isolatedStakeManager.address)).sub(balanceBefore).toBigInt()
      await expect(tx)
        .changeTokenBalances(x.hex,
          [owner, x.isolatedStakeManager.address],
          [0, contractHoldings],
        )
      expect(contractHoldings).to.be.greaterThan(x.stakedAmount)
    })
    it('fails if the address is not allowed', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      const [nextStakeId] = x.stakeIds
      await expect(x.isolatedStakeManager.connect(signerB).stakeEnd(0, nextStakeId))
        .to.be.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
      await x.isolatedStakeManager.setAuthorization(signerB.address, 2)
      await expect(x.isolatedStakeManager.connect(signerB).stakeEnd(0, nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, nextStakeId)
    })
  })
  describe('checkAndEndStake', () => {
    it('only ends the stake if the stake id matches', async () => {
      // this test shows that external enders can be assured that their
      // multicall(s) will not fail if the have the wrong data
      const x = await loadFixture(utils.stakeBagAndWait)
      const [nextStakeId] = x.stakeIds
      const skipped = x.isolatedStakeManager.checkAndStakeEnd(0, nextStakeId + 1n)
      await expect(skipped).not.to.rejected
      const tx = await skipped
      const receipt = await tx.wait()
      expect(receipt.logs).to.deep.equal([])
      const successful = x.isolatedStakeManager.checkAndStakeEnd(0, nextStakeId)
      await expect(successful)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, nextStakeId)
        // .printGasUsage()
    })
    it('skips if not authorized', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      const [nextStakeId] = x.stakeIds
      const skipped = x.isolatedStakeManager.connect(signerB).checkAndStakeEnd(0, nextStakeId)
      await expect(skipped).not.to.rejected
      const tx = await skipped
      const receipt = await tx.wait()
      expect(receipt.logs).to.deep.equal([])
      const successful = x.isolatedStakeManager.checkAndStakeEnd(0, nextStakeId)
      await x.isolatedStakeManager.setAuthorization(signerB.address, 2)
      await expect(successful)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.isolatedStakeManager.address, nextStakeId)
    })
  })
  describe('transferFromOwner', () => {
    it('transfers from the owner', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signer] = x.signers
      await expect(x.isolatedStakeManager.transferFromOwner(x.stakedAmount))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer.address, x.isolatedStakeManager.address, x.stakedAmount)
    })
    it('disallows transfers unless specifically allowed by authorization settings', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManager.connect(signerB).transferFromOwner(x.stakedAmount))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
    })
  })
  describe('setStartAuthorization', () => {
    it('allows other addresses to start stakes for a fixed number of days', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signerA, signerB] = x.signers
      await expect(x.isolatedStakeManager.transferFromOwner(x.stakedAmount))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signerA.address, x.isolatedStakeManager.address, x.stakedAmount)
      await expect(x.isolatedStakeManager.connect(signerB).stakeStartWithAuthorization(100))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')

      await expect(x.isolatedStakeManager.setStartAuthorization(signerB.address, 100, 1))
        .to.emit(x.isolatedStakeManager, 'UpdateAuthorization')

      await expect(x.isolatedStakeManager.connect(signerB).stakeStartWithAuthorization(100))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.isolatedStakeManager.address, x.nextStakeId)
    })
  })
})
