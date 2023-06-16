import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import * as withArgs from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import * as utils from './utils'

describe("StakeManager", function () {
  describe("deployment", function () {
    it('should have a percentMagnitudeLimit', async function() {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.percentMagnitudeLimit()).eventually.to.equal(
        hre.ethers.BigNumber.from(2).pow(64).toBigInt() - 1n
      )
    })
  })

  describe("withdrawals", () => {
    it("should not allow too much to be withdrawn", async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.connect(signer3).withdrawTokenTo(signer1.address, 1))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(0, 1)
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(signer1.address, 1n + x.oneMillion))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(x.oneMillion, 1n + x.oneMillion)
    })
    it('should allow the contract to define how much to withdraw', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositTokenTo(signer1.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer1).withdrawTokenTo(signer1.address, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.oneMillion * 2n)
    })
  })
  describe('depositing tokens', async () => {
    it('can transfer tokens from sender to contract', async function() {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
    })
  })
  describe('stake starts', () => {
    it('can only be initiated from the owning address', async function () {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      // const isolatedStakeManager = await x.stakeManager.callStatic.getIsolatedStakeManager(signer1.address)
      await expect(x.stakeManager.connect(signer1).stakeStart(x.oneMillion, 10))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, x.oneMillion)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(() => true, x.stakeManager.address, x.nextStakeId)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
    })
    it('multiple can be started in the same tx by the ender at the direction of the owner', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
    })
  })
  describe('stakeEnd', () => {
    it('multiple can be ended and restarted in the same transaction', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      await x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false)

      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId + 1n))
        .eventually.to.equal(signer1.address)

      await utils.moveForwardDays(11, signer4, x)
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEnd', [0, x.nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyValue, withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n + 11n)
    })
  })
  describe('stakeEndByConsent', () => {
    it('can start stakes and end them - all managed by a single contract', async function () {
      this.timeout(100_000_000)
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 369
      const half1 = Math.floor(days / 2)
      const half2 = days - half1
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer1.address, x.oneMillion / 2n, days, 0]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer2.address, x.oneMillion / 2n, days, 0]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(x.stakeManager.connect(signer3).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, half1, 0]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalanceFor', [signer3.address, x.oneMillion / 2n, days, 0]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 5n)
      // all 4 stakes are applied to the single manager (optimized)
      await expect(x.hex.stakeCount(x.stakeManager.address))
        .eventually.to.equal(6)
      await utils.moveForwardDays(half1 + 1, signer4, x)
      await expect(x.stakeManager.connect(signer4).multicall([
        x.ConsentualStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 4n,
        ]),
        x.ConsentualStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 2n,
        ]),
        x.ConsentualStakeManager.interface.encodeFunctionData('stakeEndByConsent', [
          x.nextStakeId + 0n,
        ]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 0n)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
        .printGasUsage()
      await utils.moveForwardDays(half2, signer4, x)
      const originAddress = '0x9A6a414D6F3497c05E3b1De90520765fA1E07c03'
      const tx = x.stakeManager.connect(signer4).stakeEndByConsentForMany([
        x.nextStakeId + 5n,
        x.nextStakeId + 3n,
        x.nextStakeId + 1n,
      ])
      await expect(tx)
        .to.changeTokenBalances(x.hex,
          [signer1, originAddress],
          [0, 0],
        )
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 5n)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(tx)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(tx)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
      await expect(tx)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
        .printGasUsage()
      await expect(x.hex.stakeCount(x.stakeManager.address)).eventually.to.equal(6)
    })
  })
})
