import _ from 'lodash'
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import { anyUint } from '@nomicfoundation/hardhat-chai-matchers/withArgs'

describe.only("2023-10-02 utc", function () {
  it('can end base and hsi', async () => {
    const depositDate = new Date('2023-09-15T00:00:00Z')
    const endDate = new Date('2023-10-02T00:00:00Z')
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
      const stake = await x.hex.stakeLists(hsiAddress, 0)
      return {
        tokenId,
        hsiAddress,
        stakeId: stake.stakeId,
      }
    }))
    await hre.vizor.impersonate(execAddress, async (swa) => {
      const execStakeManager = x.hsiStakeManager.connect(swa)
      await time.setNextBlockTimestamp(depositTime - 1)
      await x.hsim.connect(swa).setApprovalForAll(execStakeManager.address, true)
      await time.setNextBlockTimestamp(depositTime)
      const defaultSettings = await x.hsiStakeManager.defaultEncodedSettings()
      await expect(execStakeManager.multicall(_.map(hsis, (target) => (
        execStakeManager.interface.encodeFunctionData('depositHsi', [
          target.tokenId,
          defaultSettings,
        ])
      )), false))
        .to.emit(x.hsim, 'Transfer')
        .to.emit(x.hsim, 'HSIDetokenize')
      await utils.moveForwardDays(deltaDays, x, 1)
      const stake = await x.hex.stakeLists(x.base, 0)
      const doCalls = () => execStakeManager.multicall(
        [
          execStakeManager.interface.encodeFunctionData('stakeEndAs', [swa.address, x.base, stake.stakeId]),
          execStakeManager.interface.encodeFunctionData('hsiStakeEndMany', [_.map(hsis, 'hsiAddress')]),
        ],
        false,
      )
      // invalid timestamp - stakes will not end
      let lastBlockTime!: Date
      const getLastBlockTime = async () => new Date((await x.multicall.getCurrentBlockTimestamp()).toNumber() * 1_000)
      lastBlockTime = await getLastBlockTime()
      console.log('multicall', lastBlockTime)
      await time.setNextBlockTimestamp(endTime - 1)
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date((endTime - 1) * 1_000), await x.hsiStakeManager.isEndable(x.base))
      await expect(doCalls())
        .not.to.emit(x.hex, 'StakeEnd')
      // valid timestamp - stakes will end
      await time.setNextBlockTimestamp(endTime)
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date(endTime * 1_000), await x.hsiStakeManager.isEndable(x.base))
      const doingCalls = doCalls()

      await expect(doingCalls)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.base, stake.stakeId)
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date(endTime * 1_000), await x.hsiStakeManager.isEndable(x.base))
        // .printGasUsage()
      for (let hsi of hsis) {
        await expect(doingCalls)
          .to.emit(x.hex, 'StakeEnd')
          .withArgs(anyUint, anyUint, hsi.hsiAddress, hsi.stakeId)
      }
      const IPoolContract = await hre.ethers.getContractAt('IPoolContract', x.base, swa)
      await expect(IPoolContract.getEndStaker())
        .eventually.to.equal(execStakeManager.address)
    })
  })
})