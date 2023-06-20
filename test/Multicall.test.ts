import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('Multicall.sol', () => {
  describe('multicallWithDeadline', () => {
    it('runs multiple external functions in 1 tx but not after deadline', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const latestTime = await time.latest()
      const stakeStartData = [
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 30]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 60]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 90]),
      ]
      await expect(x.stakeManager.multicallWithDeadline(latestTime, stakeStartData, false))
        .to.revertedWithCustomError(x.stakeManager, 'Deadline')
        .withArgs(latestTime, anyUint)
      const tx = x.stakeManager.multicallWithDeadline(await time.latest() + 12, stakeStartData, false)
      await expect(tx)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId + 1n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId + 2n)
    })
  })
  describe('multicallWithPreviousBlockHash', () => {
    it('runs multiple external functions in 1 tx but only after provided block hash', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x)
      const stakeStartData = [
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 30]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 60]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 90]),
      ]
      let previousHash = hre.ethers.constants.MaxUint256.toHexString()
      await expect(x.stakeManager.multicallWithPreviousBlockHash(previousHash, stakeStartData, false))
        .to.revertedWithCustomError(x.stakeManager, 'BlockHash')
        .withArgs(previousHash, anyValue)
      const latestBlock = await hre.ethers.provider.getBlock('latest')
      previousHash = latestBlock.hash
      const tx = x.stakeManager.multicallWithPreviousBlockHash(previousHash, stakeStartData, false)
      await expect(tx)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId + 1n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, x.stakeManager.address, nextStakeId + 2n)
    })
  })
})