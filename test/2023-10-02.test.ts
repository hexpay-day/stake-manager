import _ from 'lodash'
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import { anyUint } from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { IUnderlyingStakeable } from '../artifacts/types'
import { parseLogs } from '../src/utils'
import { StakeEndEvent } from '../artifacts/types/contracts/interfaces/IHEX'

describe("2023-10-02 utc", function () {
  it('can end base and hsi', async () => {
    const depositDate = new Date('2023-10-01T00:00:00Z')
    const endDate = new Date('2023-10-02T00:00:00Z')
    const execAddress = '0xCF1500783F82867C8600bfa3023b9828F4a5a870'

    const x = await loadFixture(utils.deployFixture)
    const hour = 60*60
    const depositTime = Math.floor(+depositDate / 1_000) + (hour * 23)

    const endTime = Math.floor(+endDate / 1_000)
    const deltaDays = Math.floor(((endTime - depositTime) * 1_000) / utils.DAY) - 1
    const hsiAddresses = [
      '0xd9ebc58E0fFf9741c7749c215bb36616928e7c04',
      '0xca443C68702f789550558892c568B57ACED9eaC8',
      '0xc531C6aa0CBead6376c369084EED92173FdEb838',
      '0x3dd5410e739e26a46C477311a69D24544761D91b',
      '0xC3C2a22036C06e94B1fD08F0eB413F2F9cB681c8',
      '0x245b3eD19870Def1f1E68880130a0d2b352E5D27',
    ]
    // const hsis = _.compact(await Promise.all(tokenIds.map(async (tokenId) => {
    //   const hsiAddress = await x.hsim.hsiToken(tokenId)
    //   if (hsiAddress === hre.ethers.constants.AddressZero) {
    //     // skip case where token is not a contract
    //     return
    //   }
    //   const stake = await x.hex.stakeLists(hsiAddress, 0)
    //   return {
    //     tokenId,
    //     hsiAddress,
    //     stakeId: stake.stakeId,
    //   }
    // })))
    await hre.vizor.impersonate(execAddress, async (swa) => {
      const execStakeManager = x.existingStakeManager.connect(swa)
      if (_.now() < depositTime) {
        await time.setNextBlockTimestamp(depositTime - 1)
        await x.hsim.connect(swa).setApprovalForAll(execStakeManager.address, true)
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
      await utils.moveForwardDays(deltaDays, x, 1)
      const stake = await x.hex.stakeLists(x.base, 0)
      const doCalls = () => {
        return execStakeManager.multicall(
          [
            execStakeManager.interface.encodeFunctionData('stakeEndAs', [swa.address, x.base, stake.stakeId]),
            execStakeManager.interface.encodeFunctionData('hsiStakeEndMany', [hsiAddresses]),
          ],
          false,
        )
      }
      // invalid timestamp - stakes will not end
      let lastBlockTime!: Date
      const getLastBlockTime = async () => new Date((await x.multicall.getCurrentBlockTimestamp()).toNumber() * 1_000)
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
      const stakeListResults = await x.multicall.callStatic.aggregate3(hsiAddresses.map((hsi) => ({
        value: 0,
        allowFailure: false,
        target: x.hex.address,
        callData: x.hex.interface.encodeFunctionData('stakeLists', [hsi, 0]),
      })))
      const stakeIds = stakeListResults.map((result) => (
        (x.hex.interface.decodeFunctionResult('stakeLists', result.returnData)[0] as IUnderlyingStakeable.StakeStoreStructOutput).stakeId
      ))
      const hsiToStakeLists = new Map<string, number>(_.zip(hsiAddresses, stakeIds) as [string, number][])
      const doingCalls = doCalls()

      await expect(doingCalls)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, utils.anyUintNoPenalty, x.base, stake.stakeId)
        // .printGasUsage()
      lastBlockTime = await getLastBlockTime()
      console.log('ending', lastBlockTime, new Date(endTime * 1_000), await x.existingStakeManager.checkEndable(x.base))
      // console.log(hsiAddresses, hsiToStakeLists)
      // const tx = await doingCalls
      // const receipt = await tx.wait()
      // const logs = parseLogs([x.hex.interface], receipt.logs)
      // console.log(logs.valid.filter((log) => {
      //   const stakeEnd: StakeEndEvent = log as any
      //   if (log.name != 'StakeEnd') return
      //   const penalty = BigInt.asUintN(72, stakeEnd.args.data1.toBigInt())
      //   console.log(stakeEnd.args.stakeId, penalty)
      // }))
      for (let hsi of hsiAddresses) {
        // console.log(hsi)
        await expect(doingCalls)
          .to.emit(x.hex, 'StakeEnd')
          .withArgs(anyUint, utils.anyUintNoPenalty, x.base, stake.stakeId)
          .to.emit(x.hex, 'StakeEnd')
          .withArgs(anyUint, utils.anyUintNoPenalty, hsi, hsiToStakeLists.get(hsi))
      }
      const IPoolContract = await hre.ethers.getContractAt('IPoolContract', x.base, swa)
      await expect(IPoolContract.getEndStaker())
        .eventually.to.equal(execStakeManager.address)
    })
  })
})