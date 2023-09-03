import _ from 'lodash'
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'

describe("2023-10-03 utc", function () {
  it('can end base and hsi', async () => {
    const depositDate = new Date('2023-09-15T00:00:00Z')
    const endDate = new Date('2023-10-03T00:00:00Z')
    const execAddress = '0xE971e07BF9917e91DFbeD9165f2ea8e6FF876880'

    const x = await loadFixture(utils.deployFixture)
    const depositTime = Math.floor(+depositDate / 1_000)
    const endTime = Math.floor(+endDate / 1_000)
    const deltaDays = (((endTime - depositTime) * 1_000) / utils.DAY) - 1
    const tokenIds = [
      14095,
      14096,
      14097,
      14098,
      14099,
      14100,
    ]
    const hsis = await Promise.all(tokenIds.map(async (tokenId) => {
      const hsiAddress = await x.hsim.hsiToken(tokenId)
      return {
        tokenId,
        hsiAddress,
      }
    }))
    await hre.vizor.impersonate(execAddress, async (swa) => {
      const execStakeManager = x.hsiStakeManager.connect(swa)
      await time.setNextBlockTimestamp(depositTime - 1)
      await x.hsim.connect(swa).setApprovalForAll(execStakeManager.address, true)
      await time.setNextBlockTimestamp(depositTime)
      await expect(execStakeManager.multicall(_.map(hsis, (target) => (
        execStakeManager.interface.encodeFunctionData('depositHsi', [
          target.tokenId,
          0,
        ])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(deltaDays, x)
      const stake = await x.hex.stakeLists(x.base, 0)
      await time.setNextBlockTimestamp(endTime)
      const cDay = await x.hex.currentDay()
      console.log('ending day', cDay.toBigInt())
      console.log(new Date(endTime * 1_000))
      await expect(execStakeManager.isEndable(x.base))
        .eventually.to.equal(true)
      await time.setNextBlockTimestamp(endTime)
      await expect(execStakeManager.multicall(
        [
          execStakeManager.interface.encodeFunctionData('stakeEndAs', [swa.address, x.base, stake.stakeId]),
          execStakeManager.interface.encodeFunctionData('hsiStakeEndMany', [_.map(hsis, 'hsiAddress')]),
        ],
        false,
      ))
      .to.emit(x.hex, 'StakeEnd')
      const IPoolContract = await hre.ethers.getContractAt('IPoolContract', x.base, swa)
      await expect(IPoolContract.getEndStaker())
        .eventually.to.equal(execStakeManager.address)
    })
  })
})