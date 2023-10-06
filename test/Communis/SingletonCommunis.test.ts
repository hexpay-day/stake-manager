import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from 'hardhat'
import * as utils from '../utils'
import _ from 'lodash'
import { fromStruct } from "../../src/utils"
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('SingletonCommunis.sol', () => {
  describe('withdrawAmountByStakeId', () => {
    it('Communis withdraw', async () => {
      const x = await loadFixture(utils.deployFixture)
      // gives permission for anyone to end stake
      // requires comm minting at end
      await x.stakeManager.stakeStart(x.stakedAmount, 180)
      await utils.moveForwardDays(1n, x)

      const addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())

      const stake = await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n)

      const stk = fromStruct(stake)

      let payoutResponse = await x.communis.getPayout(stk)
      let globalInfo = await x.hex.globalInfo()
      const startBonusPayout = await x.communis.getStartBonusPayout(
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
      // at this point, only the start bonus payout has been collected
      await expect(x.stakeManager.stakeIdCommunisPayoutInfo(stk.stakeId))
        .eventually.to.equal(startBonusPayout)

      await x.stakeManager.withdrawAmountByStakeId(startBonusPayout, stk.stakeId, true)

      await expect(x.stakeManager.stakeIdCommunisPayoutInfo(stk.stakeId))
        .eventually.to.equal(0)
      // stake bonus does not exist yet!
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stk.stakeId, true))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
  })
  describe('mintCommunis end', async () => {
    it('can mint end bonuses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      // gives permission for anyone to end stake
      // requires comm minting at end
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await utils.moveForwardDays(1n, x)

      const addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())

      const stake = await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n)

      const stk = fromStruct(stake)

      let payoutResponse = await x.communis.getPayout(stk)
      let globalInfo = await x.hex.globalInfo()
      const startBonusPayout = await x.communis.getStartBonusPayout(
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

      // move forward to end day
      await utils.moveForwardDays(365n, x)
      await expect(x.stakeManager.mintCommunis(
        // end stake bonus
        2n, stk.stakeId,
        hre.ethers.ZeroAddress,
        startBonusPayout,
      ))
        .to.emit(x.communis, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
      await expect(x.stakeManager.stakeEndByConsent(stk.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(
          anyUint, utils.anyUintNoPenalty,
          await x.stakeManager.getAddress(),
          stk.stakeId
        )
        // should err out / skip due to previous end being called
        .not.to.emit(x.communis, 'Transfer')
    })
  })
  describe('distributeStakeBonusByStakeId', async () => {
    it('can distribute stake bonuses equitably', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      // gives permission for anyone to end stake
      // requires comm minting at end
      const stakeId = await utils.nextStakeId(x.hex)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer1).setFutureStakeEndCommunisAmount(stakeId + 1n, 1) // stake it all
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer2).setFutureStakeEndCommunisAmount(stakeId + 3n, 1) // stake it all
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer3).setFutureStakeEndCommunisAmount(stakeId + 5n, 1) // stake it all

      // move forward to end day
      await utils.moveForwardDays(366n, x)
      const range = _.range(Number(stakeId), Number(stakeId + 6n)) // exclusive range end
      // staker 1 ends the stake + makes each staker their own referrer
      await expect(x.stakeManager.stakeEndByConsentForMany(range))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(
          anyUint, utils.anyUintNoPenalty,
          await x.stakeManager.getAddress(),
          stakeId
        )
          // should err out / skip due to previous end being called
          .to.emit(x.communis, 'Transfer')
          .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
      await utils.moveForwardDays(90n, x) // too soon
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId, false))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId + 1n, false))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await utils.moveForwardDays(1n, x) // first end stakeable day
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId, false))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId + 1n, false))
        .to.emit(x.communis, 'Transfer')
        .withArgs(
          hre.ethers.ZeroAddress,
          await x.stakeManager.getAddress(),
          anyUint,
        )
    })
  })
})
