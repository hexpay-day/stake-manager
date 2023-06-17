import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('MaximusStakeManager.sol', () => {
  describe('createStakeManager', () => {
    it('can create for unknown addresses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      let key!: string
      key = await x.maximusStakeManagerFactory.stakeManagerKey(signerB.address, 0)
      await expect(x.maximusStakeManagerFactory.stakeManager(key))
        .eventually.to.equal(hre.ethers.constants.AddressZero)
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .to.emit(x.maximusStakeManagerFactory, 'CreateMaximusStakeManager')
        .withArgs(signerB.address, 0, anyValue)
      key = await x.maximusStakeManagerFactory.stakeManagerKey(signerB.address, 0)
      await expect(x.maximusStakeManagerFactory.stakeManager(key))
        .eventually.not.to.equal(hre.ethers.constants.AddressZero)
    })
    it('can run create with the same arguments and get the same result', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .to.emit(x.maximusStakeManagerFactory, 'CreateMaximusStakeManager')
        .withArgs(signerB.address, 0, anyValue)
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .not.to.rejected
    })
  })
  describe('authorization', () => {
    it('can check authorization levels', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA] = x.signers
      await expect(x.maximusStakeManager.isAuthorized(signerA.address, 2))
        .eventually.to.be.true
    })
    it('can set authorization levels', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, signerB] = x.signers
      await expect(x.maximusStakeManager.isAuthorized(signerB.address, 2))
        .eventually.to.be.false
      await expect(x.maximusStakeManager.setAuthorization(signerB.address, 4))
        .to.emit(x.maximusStakeManager, 'UpdateAuthorization')
        .withArgs(utils.addressToBytes32(signerB), 4)
      await expect(x.maximusStakeManager.isAuthorized(signerB.address, 2))
        .eventually.to.be.true
    })
  })
  describe('stakeEnd', () => {
    it('can end the perpetual\'s stake', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEnd(x.base, stake.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.base, stake.stakeId)
    })
    it('fails if perpetual is not whitelisted', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [, , signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEnd(signerC.address, stake.stakeId))
        .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
    })
    it('can collect rewards', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, , signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await x.maximusStakeManager.stakeEnd(x.base, stake.stakeId)
      const oneEther = hre.ethers.utils.parseEther('1')
      await signerC.sendTransaction({
        value: oneEther,
        to: x.gasReimberser.address,
      })
      await x.hex.connect(signerC).transfer(x.gasReimberser.address, x.stakedAmount)
      await expect(x.maximusStakeManager.flushNative(x.gasReimberser.address))
        .changeEtherBalances(
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [oneEther.toBigInt() * -1n, oneEther, 0],
        )
      await expect(x.maximusStakeManager.flushErc20(x.gasReimberser.address, x.hex.address))
        .changeTokenBalances(x.hex,
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [x.stakedAmount * -1n, x.stakedAmount, 0],
        )
      const balanceNative = await signerA.provider?.getBalance(x.maximusStakeManager.address)
      const bal = balanceNative?.toBigInt() || 0n
      await expect(x.maximusStakeManager.withdrawNative(signerA.address, 0))
        .changeEtherBalances(
          [x.maximusStakeManager, signerA],
          [bal * -1n, bal],
        )
      const balanceToken = await x.hex.balanceOf(x.maximusStakeManager.address)
      const balToken = balanceToken.toBigInt()
      await expect(x.maximusStakeManager.withdrawErc20(signerA.address, x.hex.address, 0))
        .changeTokenBalances(x.hex,
          [x.maximusStakeManager, signerA],
          [balToken * -1n, balToken],
        )
    })
  })
})
