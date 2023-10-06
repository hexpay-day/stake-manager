
import { loadFixture, setNextBlockBaseFeePerGas, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import _ from 'lodash'
import { anyUint, anyValue } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import * as utils from '../utils'
import { EncodableSettings } from "../../artifacts/types"
import { fromStruct } from "../../src/utils"
import { ContractTransactionResponse } from "ethers"

const checkStakeEnd = async (x: Awaited<ReturnType<typeof utils.deployFixture>>, stakeId: bigint, successful: boolean, txPromise: Promise<ContractTransactionResponse>, noPenalty = true) => {
  await expect(txPromise)
    .to.emit(x.hex, 'StakeEnd')
    .withArgs(
      anyUint,
      noPenalty ? utils.anyUintNoPenalty : anyUint,
      await x.stakeManager.getAddress(),
      stakeId
    )
  if (successful) {
    await expect(txPromise)
      .to.emit(x.communis, 'Transfer')
      .withArgs(
        hre.ethers.ZeroAddress,
        await x.stakeManager.getAddress(),
        anyUint,
      )
  } else {
    await expect(txPromise)
      .not.to.emit(x.communis, 'Transfer')
  }
}
describe("StakeManager", function () {
  describe('SingletonCommunis', () => {
    it('can mint during an end stake', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const tooFewDays = 364n
      const enoughDays = 365n
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      const commEnabledSettings = defaultSettings | (1n << 7n)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, tooFewDays, commEnabledSettings)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, enoughDays, commEnabledSettings)
      await utils.moveForwardDays(tooFewDays + 1n, x)
      await checkStakeEnd(x, nextStakeId, false, x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
      await utils.moveForwardDays(1n, x)
      await checkStakeEnd(x, nextStakeId + 1n, true, x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId + 1n))
    })
    it('can only mint from modestly large stakes', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex) + 1n
      const days = 365n
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      const commEnabledSettings = defaultSettings | (1n << 7n)
      // const tooLittle = 100n
      // const justEnough = 10_000n
      const scale = 10n**8n
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, scale, days, commEnabledSettings)
      const stk0 = await x.hex.stakeLists(x.stakeManager.getAddress(), 0)
      // presumes 0 bpb
      const tooLittle = ((10_000n * stk0.stakedHearts * scale) / stk0.stakeShares) / scale
      const justEnough = tooLittle + (tooLittle / 100n)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, tooLittle, days, commEnabledSettings)
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, justEnough, days, commEnabledSettings)
      const stk1 = await x.hex.stakeLists(x.stakeManager.getAddress(), 1)
      expect(stk1.stakeShares).to.be.lessThan(10_000, 'stake shares not low enough')
      const stk2 = await x.hex.stakeLists(x.stakeManager.getAddress(), 2)
      expect(stk2.stakeShares).to.be.greaterThanOrEqual(10_000, 'stake shares not high enough')
      await utils.moveForwardDays(days + 1n, x)
      await checkStakeEnd(x, nextStakeId, false, x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId))
      await checkStakeEnd(x, nextStakeId + 1n, true, x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId + 1n))
    })
    it('does not allow minting at early ends', async () => {
      const x = await loadFixture(utils.deployFixture)
      const nextStakeId = await utils.nextStakeId(x.hex)
      const days = 365n
      const [signer1, signer2] = x.signers
      const defaultSettings = await x.stakeManager.defaultEncodedSettings()
      const commEnabledSettings = defaultSettings | (1n << 7n)
      // console.log(BigInt.asUintN(8, commEnabledSettings).toString(2))
      const commEnabledSettingsEarlyEndable = commEnabledSettings | (1n << 1n)
      // console.log(BigInt.asUintN(8, commEnabledSettingsEarlyEndable).toString(2))
      await x.stakeManager.stakeStartFromBalanceFor(signer1.address, x.stakedAmount, days, commEnabledSettings)
      await utils.moveForwardDays(days, x) // 1 too few
      let doEnd = x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId)
      await expect(doEnd)
        .not.to.emit(x.hex, 'StakeEnd')
        .not.to.emit(x.communis, 'Transfer')
      // update settings to get by filters
      await expect(x.stakeManager.updateSettingsEncoded(nextStakeId, commEnabledSettingsEarlyEndable))
        .to.emit(x.stakeManager, 'UpdateSettings')

      doEnd = x.stakeManager.connect(signer2).stakeEndByConsent(nextStakeId)
      // end stake communis will never be minted if full time is not served
      await expect(doEnd)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(
          anyUint,
          anyUint,
          await x.stakeManager.getAddress(),
          nextStakeId
        )
        .not.to.emit(x.communis, 'Transfer')
    })
  })
})