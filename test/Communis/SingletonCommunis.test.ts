import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from 'hardhat'
import * as utils from '../utils'
import _ from 'lodash'
import { fromStruct } from "../../src/utils"
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
import { IUnderlyingStakeable } from "../../artifacts/types/contracts/UnderlyingStakeManager"
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"
const ONE_TWENTY = BigInt(120);
const MASK_120_BITS = (BigInt(1) << ONE_TWENTY) - BigInt(1);
const MASK_240_BITS = (BigInt(1) << BigInt(240)) - BigInt(1);

type DecodedInfo = ReturnType<typeof decodePayoutInfo>

function decodePayoutInfo(encodedValue: bigint) {
  const nextPayoutDay = (encodedValue >> BigInt(240));
  const endBonusDebt = ((encodedValue & MASK_240_BITS) >> ONE_TWENTY);
  const stakedAmount = (encodedValue & MASK_120_BITS);

  return { nextPayoutDay, endBonusDebt, stakedAmount };
}

function calculateExpectedPayout(
  decodedInfo: DecodedInfo,
  numberOfPayouts: bigint
): bigint {

  let expectedPayout = (decodedInfo.stakedAmount * numberOfPayouts) / 80n;
  return expectedPayout;
}
async function getExpectedPayout(stake: IUnderlyingStakeable.StakeStoreStructOutput, x: utils.X) {

  const payoutInfo = await x.stakeManager.stakeIdCommunisPayoutInfo(stake.stakeId);
  const decodedPayoutInfo = decodePayoutInfo(payoutInfo);
  const stakeManagerStakedAmount = await x.communis.addressStakedCodeak(x.stakeManager.getAddress());
  const distributableCommunisStakeBonusBefore = await x.stakeManager.distributableCommunisStakeBonus();

  const currentDay = await x.hex.currentDay()
  const numberOfPayouts = ((currentDay - decodedPayoutInfo.nextPayoutDay) / 91n) + 1n;

  let expectedPayout = calculateExpectedPayout(
    decodedPayoutInfo,
    numberOfPayouts
  );
  if (expectedPayout > distributableCommunisStakeBonusBefore) {
    expectedPayout = distributableCommunisStakeBonusBefore
  }

  return {
    currentDay: currentDay,
    numberOfPayouts: numberOfPayouts,
    decodedPayoutInfo: decodedPayoutInfo,
    expectedPayout:  expectedPayout,
    distributableCommunisStakeBonusBefore: distributableCommunisStakeBonusBefore,
    stakeManagerStakedAmount: stakeManagerStakedAmount
  }
}
async function distributeStakeBonusByStakeId(stake: IUnderlyingStakeable.StakeStoreStructOutput, signer : SignerWithAddress, x : utils.X) {
  const expectedPayoutResponse = await getExpectedPayout(stake, x);

  const balanceBefore = await x.communis.balanceOf(signer);

  await x.stakeManager.connect(signer).distributeStakeBonusByStakeId(stake.stakeId, true);

  const balanceAfter = await x.communis.balanceOf(signer);

  const distributableCommunisStakeBonusAfter = await x.stakeManager.distributableCommunisStakeBonus();

  expect(distributableCommunisStakeBonusAfter)
    .to.equal(expectedPayoutResponse.distributableCommunisStakeBonusBefore - expectedPayoutResponse.expectedPayout);

  expect(balanceAfter)
    .to.equal(balanceBefore + expectedPayoutResponse.expectedPayout);

}
async function expectPayoutDetails(signer: SignerWithAddress, x : utils.X, stakePayoutInfo: ReturnType<typeof decodePayoutInfo>, prevBalance : bigint) {

  const currentDay = await x.hex.currentDay()
  const numberOfPayouts = ((currentDay - BigInt(stakePayoutInfo.nextPayoutDay)) / 91n) + 1n;

  const expectedPayout = calculateExpectedPayout(
    stakePayoutInfo,
    numberOfPayouts
  );

  const signerBalance = (BigInt(await x.communis.balanceOf(signer)) - prevBalance);

  expect(expectedPayout)
    .to.approximately(signerBalance, 1);
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
      await expect(x.stakeManager.withdrawAmountByStakeId(startBonusPayout, stk.stakeId + 1n, true))
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
        (payoutResponse.maxPayout - startBonusPayout) / 2n, // Minumum stake amount allowed
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

      // move forward to end day
      await utils.moveForwardDays(365n, x)
      await expect(x.stakeManager.mintCommunis(
        // end stake bonus
        2n, stk.stakeId,
        hre.ethers.ZeroAddress,
        (payoutResponse.maxPayout / 2n) - 1n, // 1: (0 or n-1)
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
        (payoutResponse.maxPayout / 2n) - 1n, // 1: (0 or n-1)
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
      await x.stakeManager.setFutureStakeEndCommunisAmount(stakeId, 1)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, 365, parseInt('10000001'))
      await expect(x.stakeManager.connect(signer2).setFutureStakeEndCommunisAmount(stakeId + 1n, 2))
        // cannot modify someone else's future stake amount
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer2).setFutureStakeEndCommunisAmount(stakeId + 2n, 1)
      await x.stakeManager.stakeStartFromBalanceFor(signer2.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      await x.stakeManager.connect(signer3).setFutureStakeEndCommunisAmount(stakeId + 4n, 1)
      await x.stakeManager.stakeStartFromBalanceFor(signer3.address, x.stakedAmount, 365, parseInt('10000001'))
      range = _.range(Number(stakeId), Number(stakeId + 6n)) // exclusive range end
    })
    it('can distribute stake bonuses equitably', async () => {
      // move forward to end day
      await utils.moveForwardDays(366n, x)
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
      // await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId, false))
      //   .to.emit(x.communis, 'Transfer')
      //   .withArgs(
      //     hre.ethers.ZeroAddress,
      //     await x.stakeManager.getAddress(),
      //     anyUint,
      //   )
      await expect(x.stakeManager.distributeStakeBonusByStakeId(stakeId + 1n, false))
        .to.emit(x.communis, 'Transfer')
        .withArgs(
          hre.ethers.ZeroAddress,
          await x.stakeManager.getAddress(),
          anyUint,
        )
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
          .to.emit(x.communis, 'Transfer')
          .withArgs(
            hre.ethers.ZeroAddress,
            await x.stakeManager.getAddress(),
            anyUint,
          )
        await expect(x.stakeManager.mintStakeBonus())
          .not.to.emit(x.communis, 'Transfer')
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

      const stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      const stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);
      let prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);
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

      const stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      const stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);
      let prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);
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

      const stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      const stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);
      let prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);
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

      await utils.moveForwardDays(91n, x);

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

      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      const stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);
      let prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      expect(prevBalance1)
        .to.equal(0n);

      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);
    })
    it('Two com stakers, different stakeAmount sizes', async () => {
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
        payoutResponseStake2.maxPayout / 2n,
      ))
      .to.emit(x.communis, 'Transfer')

      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      const stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);

      const signer1Balance = await x.communis.balanceOf(signer1);
      const signer2Balance = await x.communis.balanceOf(signer2);

      expect(signer1Balance)
        .to.greaterThan(signer2Balance);
    })
    it('Two com stakers, signer2 claims before signer1, no change in payouts for signer1', async () => {
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

      const stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      const stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);

      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake1, signer1, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);

      const signer1Balance = await x.communis.balanceOf(signer1);
      const signer2Balance = await x.communis.balanceOf(signer2);

      expect(signer1Balance)
        .to.greaterThan(signer2Balance);
    })
    it('Three com stakers, long time frame / multiple payout rounds', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [signer1, signer2, signer3] = x.signers

      //Stake 1
      await x.stakeManager.connect(signer1).stakeStart(10000000, 365)
      let addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake1 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))
      await utils.moveForwardDays(366n, x)

      // console.log("Stake 1 start stake com day", await x.hex.currentDay());

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

      //Stake 3
      await x.stakeManager.connect(signer3).stakeStart(10000000, 365)
      addressStakeCount = await x.stakeManager.stakeCount(x.stakeManager.getAddress())
      const stake3 = fromStruct(await x.hex.stakeLists(x.stakeManager.getAddress(), addressStakeCount - 1n))

      await utils.moveForwardDays(366n, x)

      //console.log("Stake 2 + 3 start stake com day", await x.hex.currentDay());
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

      //Round 1
      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      let stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      let stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      let stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      let prevBalance1 = await x.communis.balanceOf(signer1);
      let prevBalance2 = await x.communis.balanceOf(signer2);
      let prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);

      let signer1Balance = await x.communis.balanceOf(signer1);
      let signer2Balance = await x.communis.balanceOf(signer2);
      let signer3Balance = await x.communis.balanceOf(signer3);

      expect(signer1Balance)
        .to.greaterThan(signer2Balance);
      expect(signer2Balance)
        .to.equal(signer3Balance);

      //Round 2
      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      prevBalance1 = await x.communis.balanceOf(signer1);
      prevBalance2 = await x.communis.balanceOf(signer2);
      prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);

      signer1Balance = await x.communis.balanceOf(signer1);
      signer2Balance = await x.communis.balanceOf(signer2);
      signer3Balance = await x.communis.balanceOf(signer3);

      expect(signer1Balance)
        .to.greaterThan(signer2Balance);
      expect(signer2Balance)
        .to.equal(signer3Balance);

      //Round 3
      await utils.moveForwardDays(91n, x)

      await x.stakeManager.mintStakeBonus();

      stake1PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake1.stakeId));
      stake2PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake2.stakeId));
      stake3PayoutInfo = decodePayoutInfo(await x.stakeManager.stakeIdCommunisPayoutInfo(stake3.stakeId));

      prevBalance1 = await x.communis.balanceOf(signer1);
      prevBalance2 = await x.communis.balanceOf(signer2);
      prevBalance3 = await x.communis.balanceOf(signer3);

      await distributeStakeBonusByStakeId(stake1, signer1, x);
      await distributeStakeBonusByStakeId(stake2, signer2, x);
      await distributeStakeBonusByStakeId(stake3, signer3, x);

      await expectPayoutDetails(signer1, x, stake1PayoutInfo, prevBalance1);
      await expectPayoutDetails(signer2, x, stake2PayoutInfo, prevBalance2);
      await expectPayoutDetails(signer3, x, stake3PayoutInfo, prevBalance3);

      signer1Balance = await x.communis.balanceOf(signer1);
      signer2Balance = await x.communis.balanceOf(signer2);
      signer3Balance = await x.communis.balanceOf(signer3);

      expect(signer1Balance)
        .to.greaterThan(signer2Balance);
      expect(signer1Balance)
        .to.greaterThan(signer3Balance);

      const balanceLeft = await x.stakeManager.distributableCommunisStakeBonus();

      expect(balanceLeft)
        .to.lessThan(10); // solidity rounding down (truncating) from distributeStakeBonusByStakeId payout division

    })
  })
})
