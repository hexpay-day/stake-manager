import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as utils from '../utils'
import _ from 'lodash'

describe('SingletonCommunis.sol', () => {
  describe('withdrawAmountByStakeId', () => {
    it('Communis withdraw', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers

      await x.stakeManager.connect(signer1).stakeStart(x.stakedAmount, 180)
      await utils.moveForwardDays(1n, x)

      const addressStakeCount = await x.stakeManager.stakeCount(await x.stakeManager.getAddress());

      const stake = await x.hex.stakeLists(await x.stakeManager.getAddress(), addressStakeCount - 1n)

      const [stakeId, stakedHearts, stakeShares, lockedDay, stakedDays, unlockedDay, isAutoStake] = stake;

      const stakeStoreObject = {
        stakeId: Number(stakeId),
        stakedHearts: Number(stakedHearts),
        stakeShares: Number(stakeShares),
        lockedDay: Number(lockedDay),
        stakedDays: Number(stakedDays),
        unlockedDay: Number(unlockedDay),
        isAutoStake
      };

      const stakeObject = {
        stakeID: Number(stakeId),
        stakedHearts: Number(stakedHearts),
        stakeShares: Number(stakeShares),
        lockedDay: Number(lockedDay),
        stakedDays: Number(stakedDays),
        unlockedDay: Number(unlockedDay)
      };

      let payoutResponse = await x.communis.getPayout(stakeObject);
      let globalInfo = await x.hex.globalInfo();
      let startBonusPayout = await x.communis.getStartBonusPayout(stakedDays, lockedDay, payoutResponse.maxPayout, payoutResponse.stakesOriginalShareRate, await x.hex.currentDay(), globalInfo[2], false);
  
      await x.stakeManager.mintCommunis(0n, stakeId, "0x0000000000000000000000000000000000000000", startBonusPayout);

      await expect(x.communis.stakeIdStartBonusPayout(stakeId))
          .eventually.to.equal(startBonusPayout)
      await expect(x.stakeManager.stakeIdStakedAmount(stakeId))
          .eventually.to.equal(startBonusPayout);

      await x.stakeManager.withdrawAmountByStakeId(startBonusPayout, stakeStoreObject);

      await expect(x.stakeManager.stakeIdStakedAmount(stakeId))
          .eventually.to.equal(0);
    })
  })
})
