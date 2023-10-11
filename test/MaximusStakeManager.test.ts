import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { ethers } from "ethers"

describe('MaximusStakeManager.sol', () => {
  describe('stakeEndAs', () => {
    it('can end the perpetual\'s stake', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEndAs(signerA.address, x.base, stake.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.base, stake.stakeId)
    })
    it('canot end early', async () => {
      const x = await loadFixture(utils.endOfBaseFixtureOffset(1n))
      const [, signerB] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEndAs(signerB.address, x.base, stake.stakeId))
        .not.to.emit(x.hex, 'StakeEnd')
    })
    it('can only end perpetuals', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [, signerB, signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEndAs(signerB.address, signerC.address, stake.stakeId))
        .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
    })
    it('can end the perpetual\'s stake and name any address as the rewards recipient', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [, signerB] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEndAs(signerB.address, x.base, stake.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.base, stake.stakeId)
    })
    it('fails if perpetual is not whitelisted', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, , signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEndAs(signerA.address, signerC.address, stake.stakeId))
        .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
    })
    it('can collect rewards', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, signerB, signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await x.maximusStakeManager.stakeEndAs(signerA.address, x.base, stake.stakeId)
      const currentPeriod = await x.publicEndStakeable.getCurrentPeriod()
      const oneEther = hre.ethers.parseEther('1')
      await signerC.sendTransaction({
        value: oneEther,
        to: x.gasReimberser.getAddress(),
      })
      await x.hex.connect(signerC as unknown as ethers.Signer).transfer(x.gasReimberser.getAddress(), x.stakedAmount)
      await expect(x.maximusStakeManager.flush(x.gasReimberser.getAddress(), signerB.address, currentPeriod + 1n, [x.hex.getAddress()]))
        .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
      const doFlush = x.maximusStakeManager.flush(x.gasReimberser.getAddress(), x.base, currentPeriod + 1n, [x.hex.getAddress()])
      await expect(doFlush)
        .not.to.emit(x.maximusStakeManager, 'CollectReward')
      await expect(doFlush).not.to.reverted
      await expect(x.maximusStakeManager.flush(x.gasReimberser.getAddress(), x.base, currentPeriod, [hre.ethers.ZeroAddress]))
        .changeEtherBalances(
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [oneEther * -1n, oneEther, 0],
        )
      await expect(x.maximusStakeManager.rewardsTo(x.base, currentPeriod + 1n))
        .eventually.to.equal(signerA.address)
      await expect(x.maximusStakeManager.flush(x.gasReimberser.getAddress(), x.base, currentPeriod, [x.hex.getAddress()]))
        .changeTokenBalances(x.hex,
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [x.stakedAmount * -1n, x.stakedAmount, 0],
        )
      const balanceNative = await signerA.provider?.getBalance(x.maximusStakeManager.getAddress())
      const bal = balanceNative || 0n
      const balanceToken = await x.hex.balanceOf(x.maximusStakeManager.getAddress())
      const balToken = balanceToken
      const doWithdraw = x.maximusStakeManager.multicall([
        x.existingStakeManager.interface.encodeFunctionData('withdrawTokenTo', [
          hre.ethers.ZeroAddress,
          signerA.address,
          0,
        ]),
        x.existingStakeManager.interface.encodeFunctionData('withdrawTokenTo', [
          await x.hex.getAddress(),
          signerA.address,
          0,
        ]),
      ], false)
      await expect(doWithdraw)
        .changeEtherBalances(
          [x.maximusStakeManager, signerA],
          [bal * -1n, bal],
        )
      await expect(doWithdraw)
        .changeTokenBalances(x.hex,
          [x.maximusStakeManager, signerA],
          [balToken * -1n, balToken],
        )
    })
  })
  describe('setExternalPerpetualFilter', () => {
    it('sets the externalPerpetualFilter property', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      await expect(x.existingStakeManager.externalPerpetualFilter())
        .eventually.to.equal(hre.ethers.ZeroAddress)
      await x.existingStakeManager.setExternalPerpetualFilter(x.externalPerpetualFilter.getAddress())
      await expect(x.existingStakeManager.externalPerpetualFilter())
        .eventually.to.equal(await x.externalPerpetualFilter.getAddress())
    })
    describe('after calling, perpetual whitelist can be updated by said contract', () => {
      it('allows the whitelist to be set which calls endStakeHEX', async () => {
        const x = await loadFixture(utils.deployFixture)
        const [signer1, signer2] = x.signers
        await x.hex.transfer(x.mockPerpetual.getAddress(), x.oneMillion / 10n)
        await x.mockPerpetual.startStakeHEX();
        await utils.moveForwardDays(2n, x) // we can now end the stake
        const args = [signer1.address, x.mockPerpetual.getAddress(), x.nextStakeId] as const
        await expect(x.existingStakeManager.checkPerpetual.staticCall(x.mockPerpetual.getAddress()))
          .eventually.to.equal(false)
        await expect(x.existingStakeManager.stakeEndAs(...args))
          .to.revertedWithCustomError(x.existingStakeManager, 'NotAllowed')
        await expect(x.maximusStakeManager.connect(signer2).setExternalPerpetualFilter(x.externalPerpetualFilter.getAddress()))
          .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
        await expect(x.maximusStakeManager.setExternalPerpetualFilter(x.externalPerpetualFilter.getAddress()))
          .not.to.reverted
        await expect(x.existingStakeManager.checkPerpetual.staticCall(x.mockPerpetual.getAddress()))
          .eventually.to.equal(false)
        await expect(x.existingStakeManager.stakeEndAs(...args))
          .to.revertedWithCustomError(x.existingStakeManager, 'NotAllowed')
        await x.externalPerpetualFilter.setVerifyPerpetualResult(true)
        await expect(x.existingStakeManager.checkPerpetual.staticCall(x.mockPerpetual.getAddress()))
          .eventually.to.equal(true)
        await expect(x.maximusStakeManager.checkEndable(x.mockPerpetual.getAddress()))
          .eventually.to.equal(true)
        await expect(x.existingStakeManager.stakeEndAs(...args))
          .to.emit(x.hex, 'StakeEnd')
          .withArgs(anyUint, utils.anyUintNoPenalty, await x.mockPerpetual.getAddress(), x.nextStakeId)
        await x.externalPerpetualFilter.setVerifyPerpetualResult(false)
        await expect(x.existingStakeManager.stakeEndAs(...args))
          .not.to.reverted
      })
    })
  })
})
