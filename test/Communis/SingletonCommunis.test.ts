import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from 'hardhat'
import * as utils from '../utils'
import _ from 'lodash'
import { fromStruct } from "../../src/utils"

describe('SingletonCommunis.sol', () => {
  describe('withdrawAmountByStakeId', () => {
    it('Communis withdraw', async () => {
      const x = await loadFixture(utils.deployFixture)
      await x.stakeManager.stakeStart(x.stakedAmount, 180)
      await utils.moveForwardDays(1n, x)

      const addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())

      const stake = await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n)

      const stk = fromStruct(stake)

      let payoutResponse = await x.communis.getPayout({
        ...stk,
        stakeID: stk.stakeId,
      })
      let globalInfo = await x.hex.globalInfo()
      let startBonusPayout = await x.communis.getStartBonusPayout(
        stk.stakedDays,
        stk.lockedDay,
        payoutResponse.maxPayout,
        payoutResponse.stakesOriginalShareRate,
        await x.hex.currentDay(),
        globalInfo[2],
        false,
      )

      await x.stakeManager.mintCommunis(
        0n, stk.stakeId,
        hre.ethers.ZeroAddress,
        startBonusPayout,
      )

      await expect(x.communis.stakeIdStartBonusPayout(stk.stakeId))
        .eventually.to.equal(startBonusPayout)
      await expect(x.stakeManager.stakeIdStakedAmount(stk.stakeId))
        .eventually.to.equal(startBonusPayout)

      await x.stakeManager.withdrawAmountByStakeId(startBonusPayout, stk.stakeId)

      await expect(x.stakeManager.stakeIdStakedAmount(stk.stakeId))
        .eventually.to.equal(0)
    })
  })
})
