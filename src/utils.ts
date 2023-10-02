import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CallOverrides, ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { setTimeout } from "timers/promises";
import { IHEX, IHEXStakeInstanceManager, IMulticall3, IUnderlyingStakeable } from "../artifacts/types";
import _ from "lodash";

import * as addresses from './addresses'

export const waitUntilNonce = async (signer: SignerWithAddress, nonce: number) => {
  let shouldWait!: boolean
  do {
    const txCountLatest = await signer.getTransactionCount('latest')
    const txCountPending = await signer.getTransactionCount('pending')
    if (txCountLatest > nonce) {
      console.log('requested=%o latest=%o pending=%o', nonce, txCountLatest, txCountPending)
      throw new Error('nonce has passed')
    }
    if (txCountLatest < txCountPending) {
      console.log('nonce discrepancy latest=%o pending=%o', txCountLatest, txCountPending)
      await setTimeout(10_000)
      shouldWait = true
      continue
    }
    if (txCountLatest === nonce) {
      shouldWait = false
    }
  } while (shouldWait);
  return nonce
}

export const defaultOverrides = async (hre: HardhatRuntimeEnvironment): Promise<CallOverrides> => {
  const gasInfo = await hre.ethers.provider.getFeeData()
  const maxFeePerGas = gasInfo.maxFeePerGas?.toBigInt() as bigint
  const maxPriorityFeePerGas = maxFeePerGas / 10n
  return {
    type: 2,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: 10_000_000n,
  }
}

export const printTx = async (txPromise: Promise<ethers.ContractTransaction>, log: string, logInputs: any[]) => {
  const receipt = await (await txPromise).wait()
  console.log(`${log} @ %o`, ...logInputs, receipt.transactionHash)
}

export const countHsi = async (address: string, hsim: IHEXStakeInstanceManager) => {
  const [tokenized, detokenized] = await Promise.all([
    hsim.balanceOf(address),
    hsim.hsiCount(address),
  ])
  return {
    tokenized: tokenized.toBigInt(),
    detokenized: detokenized.toBigInt(),
  }
}

export const getHsiApprovals = async (owner: string, operator: string, hsim: IHEXStakeInstanceManager, tokenIds: bigint[] = []) => {
  const approvedForAll = await hsim.isApprovedForAll(owner, operator)
  const approvals = await Promise.all(tokenIds.map(async (tokenId) => {
    return ethers.utils.getAddress(await hsim.getApproved(tokenId)) === operator
  }))
  const tokenIdToApproval = new Map<bigint, boolean>(_.zip(tokenIds, approvals) as [bigint, boolean][])
  return {
    all: approvedForAll,
    tokenIdToApproval,
    tokenIds,
    approvals,
  }
}


export const loadHsiFrom = async (account: string, { hsim, multicall, hex }: {
  hsim: IHEXStakeInstanceManager;
  multicall: IMulticall3;
  hex: IHEX;
}) => {
  const createCall = (target: string) => (callData: string) => ({
    target,
    value: 0,
    allowFailure: false,
    callData,
  })
  const callHsim = createCall(addresses.HSIM)
  const callHex = createCall(addresses.Hex)
  const countCalls = [
    callHsim(hsim.interface.encodeFunctionData('hsiCount', [account])),
    callHsim(hsim.interface.encodeFunctionData('balanceOf', [account])),
  ]
  const countResults = await multicall.callStatic.aggregate3(countCalls)
  const [detokenizedCount, tokenizedCount] = countResults.map((result) => BigInt(result.returnData))
  const detokenizedCalls = _.range(0, Number(detokenizedCount)).map((index) => (
    callHsim(hsim.interface.encodeFunctionData('hsiLists', [
      account,
      index,
    ]))
  ))
  const tokenizedCalls = _.range(0, Number(tokenizedCount)).map((index) => (
    callHsim(hsim.interface.encodeFunctionData('tokenOfOwnerByIndex', [
      account,
      index,
    ]))
  ))
  const allCalls = detokenizedCalls.concat(tokenizedCalls)
  const allResults = await multicall.callStatic.aggregate3(allCalls)
  // for whatever reason, index is not given during partition
  const detokenizedStakes = allResults.slice(0, detokenizedCalls.length) as IMulticall3.ResultStructOutput[]
  const tokenizedStakes = allResults.slice(detokenizedCalls.length) as IMulticall3.ResultStructOutput[]
  const detokenizedAddresses = detokenizedStakes.map((result) => ethers.utils.getAddress(`0x${result.returnData.slice(-40)}`))
  const tokenIds = tokenizedStakes.map((result) => BigInt(result.returnData))
  const tokenHsiCalls = tokenIds.map((tokenId) => (
    callHsim(hsim.interface.encodeFunctionData('hsiToken', [tokenId]))
  ))
  const tokenHsiResults = tokenHsiCalls ? await multicall.callStatic.aggregate3(tokenHsiCalls) : [] as IMulticall3.ResultStructOutput[]
  const tokenizedHsi = tokenHsiResults.map((result) => ethers.utils.getAddress(`0x${result.returnData.slice(-40)}`))
  const allHsi = detokenizedAddresses.concat(tokenizedHsi)
  const stakeListCalls = allHsi.map((hsi) => callHex(
    hex.interface.encodeFunctionData('stakeLists', [hsi, 0])
  ))
  const stakeListsResults = await multicall.callStatic.aggregate3(stakeListCalls)
  const stakesResults = stakeListsResults.map((result) => (hex.interface.decodeFunctionResult('stakeLists', result.returnData))[0] as unknown as IUnderlyingStakeable.StakeStoreStructOutput)
  return {
    stakes: stakesResults,
    all: allHsi,
    detokenizedAddresses,
    tokenizedAddresses: tokenizedHsi,
  } as const
}

export const parseLogs = (interfaces: ethers.utils.Interface[], logs: ethers.providers.Log[]) => {
  const logDescriptions = _.map(logs, (log) => {
    for (const ntrface of interfaces) {
      try {
        return ntrface.parseLog(log)
      } catch (err) {}
    }
  })
  return {
    all: logDescriptions,
    valid: _.compact(logDescriptions),
  }
}
