import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import * as config from '../src/config'
import { ethers } from "ethers"

describe('IsolatedStakeManager.sol', () => {
  describe('state', () => {
    it('knows what to target', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.isolatedStakeManager.TARGET())
        .eventually.to.equal(config.hexAddress)
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
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).acceptOwnership())
        .to.emit(x.isolatedStakeManager, 'OwnershipTransferred')
        .withArgs(signerA.address, signerB.address)
    })
  })
  describe('instance creation', () => {
    it('creates isolated stake managers for provided addresses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManagerFactory.isolatedStakeManagers(signerB.address))
        .eventually.to.equal(hre.ethers.ZeroAddress)
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
      await expect(x.isolatedStakeManager.authorization(hre.ethers.zeroPadValue(signerA.address, 32)))
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
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).setAuthorization(signerB.address, 5))
        .to.be.revertedWithCustomError(x.isolatedStakeManager, 'OnlyOwner')
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
        .withArgs(anyUint, await x.isolatedStakeManager.getAddress(), x.nextStakeId)
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer.address, await x.isolatedStakeManager.getAddress(), x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(await x.isolatedStakeManager.getAddress(), hre.ethers.ZeroAddress, x.oneMillion)
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
      const tx = x.hex.connect(signer as unknown as ethers.Signer).transfer(x.isolatedStakeManager.getAddress(), stakeAmount)
      await expect(tx)
        .changeTokenBalances(x.hex,
          [signer, x.isolatedStakeManager],
          [stakeAmount * -1n, stakeAmount],
        )
      await expect(x.isolatedStakeManager.stakeStart(0, 30))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.isolatedStakeManager.getAddress(), x.nextStakeId)
    })
    it('cannot start stakes without authorization', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signerA, signerB] = x.signers
      await x.hex.connect(signerA as unknown as ethers.Signer).transfer(x.isolatedStakeManager.getAddress(), x.stakedAmount)
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeStart(x.stakedAmount, 30))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
    })
  })
  describe('stakeEnd', () => {
    it('ends stakes', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [nextStakeId] = x.stakeIds
      const balanceBefore = await x.hex.balanceOf(x.isolatedStakeManager.getAddress())
      const tx = x.isolatedStakeManager.stakeEnd(0, nextStakeId)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, await x.isolatedStakeManager.getAddress(), nextStakeId)
      const owner = await x.isolatedStakeManager.owner()
      const contractHoldings = (await x.hex.balanceOf(x.isolatedStakeManager.getAddress())) - balanceBefore
      await expect(tx)
        .changeTokenBalances(x.hex,
          [owner, await x.isolatedStakeManager.getAddress()],
          [0, contractHoldings],
        )
      expect(contractHoldings).to.be.greaterThan(x.stakedAmount)
    })
    it('fails if the address is not allowed', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      const [nextStakeId] = x.stakeIds
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeEnd(0, nextStakeId))
        .to.be.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
      await x.isolatedStakeManager.setAuthorization(signerB.address, 2)
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeEnd(0, nextStakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, await x.isolatedStakeManager.getAddress(), nextStakeId)
    })
    it('fails if caller is unable to end stake early', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, nextStakeId] = x.stakeIds
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeEnd(1, nextStakeId))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
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
      expect(receipt?.logs).to.deep.equal([])
      const successful = x.isolatedStakeManager.checkAndStakeEnd(0, nextStakeId)
      await expect(successful)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, await x.isolatedStakeManager.getAddress(), nextStakeId)
        // .printGasUsage()
    })
    it('skips if not authorized', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      const [nextStakeId] = x.stakeIds
      const skipped = x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).checkAndStakeEnd(0, nextStakeId)
      await expect(skipped).not.to.rejected
      const tx = await skipped
      const receipt = await tx.wait()
      expect(receipt?.logs).to.deep.equal([])
      const successful = x.isolatedStakeManager.checkAndStakeEnd(0, nextStakeId)
      await x.isolatedStakeManager.setAuthorization(signerB.address, 2)
      await expect(successful)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, await x.isolatedStakeManager.getAddress(), nextStakeId)
    })
  })
  describe('transferFromOwner', () => {
    it('transfers from the owner', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signer] = x.signers
      await expect(x.isolatedStakeManager.transferFromOwner(x.stakedAmount))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer.address, await x.isolatedStakeManager.getAddress(), x.stakedAmount)
    })
    it('disallows transfers unless specifically allowed by authorization settings', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [, signerB] = x.signers
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).transferFromOwner(x.stakedAmount))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
    })
  })
  describe('transferToOwner', () => {
    it('transfers tokens to the owner', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signerA] = x.signers
      await x.isolatedStakeManager.transferFromOwner(x.stakedAmount)
      await expect(x.isolatedStakeManager.transferToOwner())
        .to.emit(x.hex, 'Transfer')
        .withArgs(await x.isolatedStakeManager.getAddress(), signerA.address, x.stakedAmount)
    })
    it('disallows unauthorized transfers', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signerA, signerB] = x.signers
      await x.isolatedStakeManager.transferFromOwner(x.stakedAmount)
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).transferToOwner())
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
      await x.isolatedStakeManager.setAuthorization(signerB.address, 8)
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).transferToOwner())
        .to.emit(x.hex, 'Transfer')
        .withArgs(await x.isolatedStakeManager.getAddress(), signerA.address, x.stakedAmount)
    })
  })
  describe('setStartAuthorization', () => {
    it('allows other addresses to start stakes for a fixed number of days', async () => {
      const x = await loadFixture(utils.stakeBagAndWait)
      const [signerA, signerB] = x.signers
      await expect(x.isolatedStakeManager.transferFromOwner(x.stakedAmount))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signerA.address, await x.isolatedStakeManager.getAddress(), x.stakedAmount)
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeStartWithAuthorization(100))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'NotAllowed')
      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).setStartAuthorization(signerB.address, 100, 1))
        .to.revertedWithCustomError(x.isolatedStakeManager, 'OnlyOwner')

      await expect(x.isolatedStakeManager.setStartAuthorization(signerB.address, 100, 1))
        .to.emit(x.isolatedStakeManager, 'UpdateAuthorization')
      await expect(x.isolatedStakeManager.startAuthorizationKey(signerB.address, 100))
        .eventually.to.equal(utils.numberToBytes32((BigInt(signerB.address) << 16n) + 100n))

      await expect(x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeStartWithAuthorization(100))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.isolatedStakeManager.getAddress(), x.nextStakeId)
      // what happens when you have no hex to start a stake with
      const doStakeStart = x.isolatedStakeManager.connect(signerB as unknown as ethers.Signer).stakeStartWithAuthorization(100)
      await expect(doStakeStart)
        .not.to.emit(x.hex, 'StakeStart')
      await expect(doStakeStart).not.to.reverted
    })
  })
})
