import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { toBeHex } from "ethers"

describe('Multicall.sol', () => {
  describe('failures', () => {
    it('can handle failures optionally', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 30]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [0, 30]),
      ], false))
      .to.revertedWith('HEX: newStakedHearts must be at least minimum shareRate')
    })
  })
  describe('multicallBetweenTimestamp', () => {
    it('runs multiple external functions in 1 tx but not outside of timestamp bounds', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      let latestTime!: number
      latestTime = await time.latest()
      const stakeStartData = [
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 30]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 60]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 90]),
      ]
      // executed too late
      await time.setNextBlockTimestamp(latestTime + 1)
      await expect(x.stakeManager.multicallBetweenTimestamp(latestTime, latestTime, stakeStartData, false))
        .to.revertedWithCustomError(x.stakeManager, 'OutsideTimestamps')
        .withArgs(latestTime, latestTime, anyUint)
      // executed too soon
      latestTime = await time.latest()
      await time.setNextBlockTimestamp(latestTime + 1)
      await expect(x.stakeManager.multicallBetweenTimestamp(latestTime + 2, latestTime + 2, stakeStartData, false))
        .to.revertedWithCustomError(x.stakeManager, 'OutsideTimestamps')
        .withArgs(latestTime + 2, latestTime + 2, anyUint)
      const tx = x.stakeManager.multicallBetweenTimestamp(await time.latest(), await time.latest() + 12, stakeStartData, false)
      await expect(tx)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId + 1n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId + 2n)
    })
  })
  describe('multicallWithPreviousBlockHash', () => {
    it('runs multiple external functions in 1 tx but only after provided block hash', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const stakeStartData = [
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 30]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 60]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.stakedAmount, 90]),
      ]
      let previousHash = toBeHex(hre.ethers.MaxUint256)
      await expect(x.stakeManager.multicallWithPreviousBlockHash(previousHash, stakeStartData, false))
        .to.revertedWithCustomError(x.stakeManager, 'BlockHash')
        .withArgs(previousHash, anyValue)
      const latestBlock = await hre.ethers.provider.getBlock('latest')
      previousHash = latestBlock?.hash as string
      const tx = x.stakeManager.multicallWithPreviousBlockHash(previousHash, stakeStartData, false)
      await expect(tx)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId + 1n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(anyUint, await x.stakeManager.getAddress(), nextStakeId + 2n)
    })
  })
})