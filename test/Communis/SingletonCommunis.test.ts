import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from 'hardhat'
import * as utils from '../utils'
import _ from 'lodash'
import { fromStruct } from "../../src/utils"
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
const ONE_TWENTY = BigInt(120);
const MASK_120_BITS = (BigInt(1) << ONE_TWENTY) - BigInt(1);
const MASK_240_BITS = (BigInt(1) << BigInt(240)) - BigInt(1);

function decodePayoutInfo(encodedValue: bigint): {nextPayoutDay: bigint, endBonusDebt: bigint, stakedAmount: bigint} {
  const nextPayoutDay = (encodedValue >> BigInt(240));
  const endBonusDebt = ((encodedValue & MASK_240_BITS) >> ONE_TWENTY);
  const stakedAmount = (encodedValue & MASK_120_BITS);

  return { nextPayoutDay, endBonusDebt, stakedAmount };
}

function calculateExpectedPayout(
  distributableCommunisStakeBonus: bigint,
  stakedAmount: bigint,
  stakeManagerStakedAmount: bigint
): bigint {
  const expectedPayout = (
    (distributableCommunisStakeBonus * (stakedAmount * 100000n))
  ) / (100000n * stakeManagerStakedAmount);

  return expectedPayout;
}
async function getExpectedPayout(stake : any, signer : any, x : any) {

  const payoutInfo = await x.stakeManager.stakeIdCommunisPayoutInfo(stake.stakeId);
  const decodedPayoutInfo = decodePayoutInfo(payoutInfo);
  const stakeManagerStakedAmount = await x.communis.addressStakedCodeak(x.stakeManager.getAddress());
  const distributableCommunisStakeBonusBefore = await x.stakeManager.distributableCommunisStakeBonus();

  const expectedPayout = calculateExpectedPayout(
    distributableCommunisStakeBonusBefore,
    decodedPayoutInfo.stakedAmount,
    stakeManagerStakedAmount
  );

  const currentDay = await x.hex.currentDay()
  const numberOfPayouts = ((currentDay - decodedPayoutInfo.nextPayoutDay) / 91n) + 1n;

  return {
    currentDay: currentDay,
    numberOfPayouts: numberOfPayouts,
    decodedPayoutInfo: decodedPayoutInfo,
    expectedPayout:  expectedPayout,
    distributableCommunisStakeBonusBefore: distributableCommunisStakeBonusBefore,
    stakeManagerStakedAmount: stakeManagerStakedAmount
  }
}
async function distributeStakeBonusByStakeId(stake : any, signer : any, x : any) {
  const expectedPayoutResponse = await getExpectedPayout(stake, signer, x);

  const balanceBefore = await x.communis.balanceOf(signer);

  await x.stakeManager.connect(signer).distributeStakeBonusByStakeId(stake.stakeId, true);

  const balanceAfter = await x.communis.balanceOf(signer);

  const distributableCommunisStakeBonusAfter = await x.stakeManager.distributableCommunisStakeBonus();

  expect(distributableCommunisStakeBonusAfter)
  .to.equal(expectedPayoutResponse.distributableCommunisStakeBonusBefore - expectedPayoutResponse.expectedPayout);

  expect(balanceAfter)
    .to.equal(balanceBefore + expectedPayoutResponse.expectedPayout);

}

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

      await expect(x.stakeManager.withdrawAmountByStakeId(startBonusPayout + 1n, stk.stakeId, true))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')

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
    it('can mint good account bonuses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      // gives permission for anyone to end stake
      // requires comm minting at end
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      // move forward to end day
      await utils.moveForwardDays(366n + 37n, x)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        1n, x.nextStakeId,
        signer3.address,
        0n,
      )).to.revertedWith('COM: Grace period has not ended')
      await utils.moveForwardDays(1n, x)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        1n, x.nextStakeId,
        signer3.address,
        0n,
      ))
        .to.emit(x.communis, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        1n, x.nextStakeId + 1n,
        signer3.address,
        1n,
      ))
        .to.emit(x.communis, 'Transfer')
        .withArgs(hre.ethers.ZeroAddress, await x.stakeManager.getAddress(), anyUint)
        .to.emit(x.communis, 'Transfer')
        .withArgs(await x.stakeManager.getAddress(), signer3.address, anyUint)
    })
    it('can stake nearly none of end bonuses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1] = x.signers
      // gives permission for anyone to end stake (00000001)
      // requires comm minting at end (10000000)
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
        2n, // 1: (0 or n-1)
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
  describe('many stakers', () => {
    let x!: Awaited<ReturnType<typeof utils.deployFixture>>
    let stakeId!: bigint
    let range!: number[]
    beforeEach(async () => {
      x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers
      // gives permission for anyone to end stake
      // requires comm minting at end
      stakeId = await utils.nextStakeId(x.hex)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer1).setFutureStakeEndCommunisAmount(stakeId + 1n, 1) // stake it all
      await expect(x.stakeManager.connect(signer2).setFutureStakeEndCommunisAmount(stakeId + 1n, 2)) // stake nothing!
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer2).setFutureStakeEndCommunisAmount(stakeId + 3n, 1) // stake it all
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer3).setFutureStakeEndCommunisAmount(stakeId + 5n, 1) // stake it all
      range = _.range(Number(stakeId), Number(stakeId + 6n)) // exclusive range end
    })
    describe('distributeStakeBonusByStakeId', async () => {
      it('can distribute stake bonuses equitably', async () => {
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
    describe('mintStakeBonus', async () => {
      it('collects stake bonuses for everyone as they accrue on communis', async () => {
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
        await expect(x.stakeManager.mintStakeBonus())
          .to.emit(x.communis, 'Transfer')
          .withArgs(
            hre.ethers.ZeroAddress,
            await x.stakeManager.getAddress(),
            anyUint,
          )
        await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId + 1n, false))
          .not.to.emit(x.communis, 'Transfer')
      })
    })
  })
  describe('distributeStakeBonusByStakeId', () => {
    it('Three com stakers claiming their contribution', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers

      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      await x.stakeManager.connect(signer2).stakeStart(20000000, 365)
      await x.stakeManager.connect(signer3).stakeStart(30000000, 365)

      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())

      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 3n))
      const stake2 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 2n))
      const stake3 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake1 = await x.communis.getPayout(stake1)
      await expect(x.stakeManager.connect(signer1).mintCommunis(
        // end stake bonus
        2n, stake1.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake1.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake2 = await x.communis.getPayout(stake2)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        2n, stake2.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake2.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake3 = await x.communis.getPayout(stake3)
      await expect(x.stakeManager.connect(signer3).mintCommunis(
        // end stake bonus
        2n, stake3.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake3.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

    })
    it('Three com stakers claiming their contribution different intervals', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers

      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(10n, x)

      await x.stakeManager.connect(signer2).stakeStart(20000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake2 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(20n, x)

      await x.stakeManager.connect(signer3).stakeStart(30000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake3 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake1 = await x.communis.getPayout(stake1)
      await expect(x.stakeManager.connect(signer1).mintCommunis(
        // end stake bonus
        2n, stake1.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake1.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake2 = await x.communis.getPayout(stake2)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        2n, stake2.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake2.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake3 = await x.communis.getPayout(stake3)
      await expect(x.stakeManager.connect(signer3).mintCommunis(
        // end stake bonus
        2n, stake3.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake3.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(182n, x)

      await x.stakeManager.mintStakeBonus();

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

    })
    it('Three com stakers claiming their contribution different intervals, multiple claims', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers

      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake1 = await x.communis.getPayout(stake1)
      await expect(x.stakeManager.connect(signer1).mintCommunis(
        // end stake bonus
        2n, stake1.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake1.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)
      await x.stakeManager.mintStakeBonus();
      await distributeStakeBonusByStakeId(stake1, signer1, x);

      await x.stakeManager.connect(signer2).stakeStart(20000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake2 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(20n, x)

      await x.stakeManager.connect(signer3).stakeStart(30000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake3 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake2 = await x.communis.getPayout(stake2)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        2n, stake2.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake2.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake3 = await x.communis.getPayout(stake3)
      await expect(x.stakeManager.connect(signer3).mintCommunis(
        // end stake bonus
        2n, stake3.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake3.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

    })
    it('Three com stakers claiming their contribution different intervals, first never claims', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers

      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake1 = await x.communis.getPayout(stake1)
      await expect(x.stakeManager.connect(signer1).mintCommunis(
        // end stake bonus
        2n, stake1.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake1.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)
      // await x.stakeManager.mintStakeBonus();
      // await distributeStakeBonusByStakeId(stake1, signer1, x);

      await x.stakeManager.connect(signer2).stakeStart(20000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake2 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(20n, x)

      await x.stakeManager.connect(signer3).stakeStart(30000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake3 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      let payoutResponseStake2 = await x.communis.getPayout(stake2)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        2n, stake2.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake2.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      let payoutResponseStake3 = await x.communis.getPayout(stake3)
      await expect(x.stakeManager.connect(signer3).mintCommunis(
        // end stake bonus
        2n, stake3.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake3.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

    })
    it('Two com stakers, first reduced by second', async () => {
      //first signer stakes their com, but does not mint their stakeBonus until after a second signer stakes their com and mints their stakeBonus first.
      //This reduces first signers payout since and redistributes to second.
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2] = x.signers

      //Stake 1
      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))
      await utils.moveForwardDays(366n, x)

      let payoutResponseStake1 = await x.communis.getPayout(stake1)
      await expect(x.stakeManager.connect(signer1).mintCommunis(
        // end stake bonus
        2n, stake1.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake1.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      //Stake 2
      await x.stakeManager.connect(signer2).stakeStart(10000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake2 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))
      await utils.moveForwardDays(366n, x)

      let payoutResponseStake2 = await x.communis.getPayout(stake2)
      await expect(x.stakeManager.connect(signer2).mintCommunis(
        // end stake bonus
        2n, stake2.stakeId,
        hre.ethers.ZeroAddress,
        payoutResponseStake2.maxPayout,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      await distributeStakeBonusByStakeId(stake2, signer2, x);

      await distributeStakeBonusByStakeId(stake1, signer1, x);

      const signer1Balance = await x.communis.balanceOf(signer1);
      const signer2Balance = await x.communis.balanceOf(signer2);

      expect(signer2Balance)
        .to.greaterThan(signer1Balance);
    })
  })
  // describe('#withdrawAmountByStakeId', () => {
  //   it('disallows withdraw amount to be greater than staked amount', async () => {
  //     //
  //   })
  // })
})
