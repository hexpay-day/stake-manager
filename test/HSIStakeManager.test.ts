import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { HSIStakeManager } from "../artifacts/types"

describe('HSIStakeManager.sol', () => {
  describe('depositHsi', () => {
    it('can deposit hsis into the contract', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 3]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
    })
  })
  describe('mintRewards', () => {
    it('can mint rewards', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 3]),
      ])), false)
      await utils.moveForwardDays(10, x)
      await expect(x.hsiStakeManager.mintRewards(x.hsiStakeParams))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.hsiStakeManager.address, x.signers[0].address, anyUint)
    })
    it('anyone can mint rewards with approval', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 3]),
      ])), false)
      const [signerA, signerB] = x.signers
      await utils.moveForwardDays(10, x)
      const balanceBefore = await x.hedron.balanceOf(signerA.address)
      await x.hsiStakeManager.connect(signerB).mintRewards(x.hsiStakeParams)
      await expect(x.hedron.balanceOf(signerA.address))
        .eventually.to.equal(balanceBefore, 'no rewards were minted')
      await expect(x.hsiStakeManager.multicall(x.hsiAddresses.map((hsiAddress) => (
        x.hsiStakeManager.interface.encodeFunctionData('setAuthorization', [signerB.address, hsiAddress, 1])
      )), false))
        .to.emit(x.hsiStakeManager, 'UpdateAuthorization')
        .withArgs(anyValue, 1)
      await expect(x.hsiStakeManager.isAuthorized(signerB.address, x.hsiAddresses[0], 0))
        .eventually.to.be.true
      await expect(x.hsiStakeManager.connect(signerB).mintRewards(x.hsiStakeParams))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.hsiStakeManager.address, x.signers[0].address, anyUint)
    })
    it('does not allow self authorization', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [, signerB] = x.signers
      await expect(x.hsiStakeManager.connect(signerB).setAuthorization(signerB.address, x.hsiAddresses[0], 0))
        .to.revertedWithCustomError(x.hsiStakeManager, 'NotAllowed')
      await x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 3]),
      ])), false)
      await expect(x.hsiStakeManager.connect(signerB).setAuthorization(signerB.address, x.hsiAddresses[0], 0))
        .to.revertedWithCustomError(x.hsiStakeManager, 'NotAllowed')
    })
    it('end deposited stakes', async () => {
      const x = await loadFixture(utils.deployAndProcureHSIFixture)
      const [signerA] = x.signers
      await expect(x.hsiStakeManager.multicall(_.flatMap(x.hsiTokenIds, (tokenId) => ([
        x.hsiStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, 3]),
      ])), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(30, x)
      // 30 day stake is in last
      await expect(x.hsiStakeManager.hsiStakeEndMany([x.hsiStakeParams[0]]))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.hsiStakeParams[0].hsiAddress, anyUint)
        .to.emit(x.hsim, 'HSIEnd')
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeParams[0].hsiAddress, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiStakeParams[0].hsiAddress, x.hsiStakeManager.address, anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.hsiStakeManager.address, signerA.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.hsiStakeManager.address, anyUint)
        .to.emit(x.hedron, 'Transfer')
        .withArgs(x.hsiStakeManager.address, signerA.address, anyUint)
    })
  })
})
