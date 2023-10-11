import _ from 'lodash'
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import { anyUint } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { ethers } from 'ethers'
import { ExistingStakeManager } from '../artifacts/types'

describe("2023-10-02 utc", function () {
  it('can end base and hsi', async function () {
    const depositDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-02T00:00:00Z')
    const execAddress = '0xCF1500783F82867C8600bfa3023b9828F4a5a870'

    if (+depositDate < _.now()) {
      this.skip()
    }

    const x = await loadFixture(utils.deployFixture)
    const hour = 60*60
    const depositTime = Math.floor(+depositDate / 1_000) + (hour * 23)

    const endTime = Math.floor(+endDate / 1_000)
    const deltaDays = BigInt(Math.floor(((endTime - depositTime) * 1_000) / utils.DAY) - 1)
    const tokenIds = [
      14095,
      14096,
      14097,
      14098,
      14099,
      14100,
    ]
    const hsis = _.compact(await Promise.all(tokenIds.map(async (tokenId) => {
      const hsiAddress = await x.hsim.hsiToken(tokenId)
      if (hsiAddress === ethers.ZeroAddress) {
        // skip case where token is not a contract
        return
      }
      const stake = await x.hex.stakeLists(hsiAddress, 0)
      return {
        tokenId,
        hsiAddress,
        stakeId: stake.stakeId,
      }
    })))
    await hre.vizor.impersonate(execAddress, async (swa) => {
      const execStakeManager = x.existingStakeManager.connect(swa) as ExistingStakeManager
      if (_.now() < depositTime) {
        await time.setNextBlockTimestamp(depositTime - 1)
        await x.hsim.connect(swa as unknown as ethers.Signer).setApprovalForAll(execStakeManager.getAddress(), true)
        await time.setNextBlockTimestamp(depositTime)
        // const defaultSettings = await x.existingStakeManager.defaultEncodedSettings()
        // await expect(execStakeManager.multicall(_.map(hsis, (target) => (
        //   execStakeManager.interface.encodeFunctionData('depositHsi', [
        //     target.tokenId,
        //     defaultSettings,
        //   ])
        // )), false))
        //   .to.emit(x.hsim, 'Transfer')
        //   .to.emit(x.hsim, 'HSIDetokenize')
      }
      await utils.moveForwardDays(deltaDays, x, 7n)
      const stake = await x.hex.stakeLists(x.base, 0)
      const doCalls = () => {
        return execStakeManager.multicall(
          [
            execStakeManager.interface.encodeFunctionData('stakeEndAs', [swa.address, x.base, stake.stakeId]),
            execStakeManager.interface.encodeFunctionData('hsiStakeEndMany', [_.map(hsis, 'hsiAddress')]),
          ],
          false,
        )
      }
      // invalid timestamp - stakes will not end
      let lastBlockTime!: Date
      const getLastBlockTime = async () => new Date(Number((await x.multicall.getCurrentBlockTimestamp()) * 1_000n))
      lastBlockTime = await getLastBlockTime()
      console.log('multicall', lastBlockTime)
      await time.setNextBlockTimestamp(endTime - 1)
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date((endTime - 1) * 1_000), await x.existingStakeManager.checkEndable(x.base))
      await expect(doCalls())
        .not.to.emit(x.hex, 'StakeEnd')
      // valid timestamp - stakes will end
      await time.setNextBlockTimestamp(endTime)
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date(endTime * 1_000), await x.existingStakeManager.checkEndable(x.base))
      // const stakeListResults = await x.multicall.callStatic.aggregate3(hsiAddresses.map((hsi) => ({
      //   value: 0,
      //   allowFailure: false,
      //   target: x.hex.address,
      //   callData: x.hex.interface.encodeFunctionData('stakeLists', [hsi, 0]),
      // })))
      // const stakeIds = stakeListResults.map((result) => (
      //   (x.hex.interface.decodeFunctionResult('stakeLists', result.returnData)[0] as IUnderlyingStakeable.StakeStoreStructOutput).stakeId
      // ))
      // const hsiToStakeLists = new Map<string, number>(_.zip(hsiAddresses, stakeIds) as [string, number][])
      const doingCalls = doCalls()

      await expect(doingCalls)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.base, stake.stakeId)
        // .printGasUsage()
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date(endTime * 1_000), await x.existingStakeManager.checkEndable(x.base))
      for (let hsi of hsis) {
        await expect(doingCalls)
          .to.emit(x.hex, 'StakeEnd')
          .withArgs(anyUint, utils.anyUintNoPenalty, hsi.hsiAddress, hsi.stakeId)
      }
      const IPoolContract = await hre.ethers.getContractAt('IPoolContract', x.base, swa as unknown as ethers.Signer)
      await expect(IPoolContract.getEndStaker())
        .eventually.to.equal(execStakeManager.getAddress())
    })
  })
})