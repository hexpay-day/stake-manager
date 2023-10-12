import { Result, ethers } from "ethers";
import { setTimeout } from "timers/promises";
import { HEX, HEXStakeInstanceManager, IMulticall3, IUnderlyingStakeable } from "../artifacts/types";
import _ from "lodash";
import * as addresses from './addresses'

export const waitUntilNonce = async (provider: ethers.Provider, account: string, nonce: number) => {
  let shouldWait!: boolean
  do {
    const txCountLatest = await provider.getTransactionCount(account, 'latest')
    const txCountPending = await provider.getTransactionCount(account, 'pending')
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

export const defaultOverrides = (gasInfo: ethers.FeeData) => {
  const maxFeePerGas = gasInfo.maxFeePerGas as bigint
  const maxPriorityFeePerGas = maxFeePerGas / 10n
  return {
    type: 2,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasLimit: 10_000_000n,
  } as const
}

export const printTx = async (txPromise: Promise<ethers.ContractTransactionResponse>, log: string, logInputs: any[]) => {
  const receipt = await (await txPromise).wait()
  console.log(`${log} @ %o`, ...logInputs, receipt?.hash)
}

export const countHsi = async (address: string, hsim: HEXStakeInstanceManager) => {
  const [tokenized, detokenized] = await Promise.all([
    hsim.balanceOf(address),
    hsim.hsiCount(address),
  ])
  return {
    tokenized,
    detokenized,
  }
}

export const getHsiApprovals = async (owner: string, operator: string, hsim: HEXStakeInstanceManager, tokenIds: bigint[] = []) => {
  const approvedForAll = await hsim.isApprovedForAll(owner, operator)
  const approvals = await Promise.all(tokenIds.map(async (tokenId) => {
    return ethers.getAddress(await hsim.getApproved(tokenId)) === operator
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
  hsim: HEXStakeInstanceManager;
  multicall: IMulticall3;
  hex: HEX;
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
  const countResults = await multicall.aggregate3.staticCall(countCalls)
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
  const allResults = await multicall.aggregate3.staticCall(allCalls)
  // for whatever reason, index is not given during partition
  const detokenizedStakes = allResults.slice(0, detokenizedCalls.length) as IMulticall3.ResultStructOutput[]
  const tokenizedStakes = allResults.slice(detokenizedCalls.length) as IMulticall3.ResultStructOutput[]
  const detokenizedAddresses = detokenizedStakes.map((result) => ethers.getAddress(`0x${result.returnData.slice(-40)}`))
  const tokenIds = tokenizedStakes.map((result) => BigInt(result.returnData))
  const tokenHsiCalls = tokenIds.map((tokenId) => (
    callHsim(hsim.interface.encodeFunctionData('hsiToken', [tokenId]))
  ))
  const tokenHsiResults = tokenHsiCalls ? await multicall.aggregate3.staticCall(tokenHsiCalls) : [] as IMulticall3.ResultStructOutput[]
  const tokenizedHsi = tokenHsiResults.map((result) => ethers.getAddress(`0x${result.returnData.slice(-40)}`))
  const allHsi = detokenizedAddresses.concat(tokenizedHsi)
  const stakeListCalls = allHsi.map((hsi) => callHex(
    hex.interface.encodeFunctionData('stakeLists', [hsi, 0])
  ))
  const stakeListsResults = await multicall.aggregate3.staticCall(stakeListCalls)
  const stakesResults = stakeListsResults.map((result) => (hex.interface.decodeFunctionResult('stakeLists', result.returnData))[0] as unknown as IUnderlyingStakeable.StakeStoreStructOutput)
  return {
    stakes: stakesResults,
    all: allHsi,
    detokenizedAddresses,
    tokenizedAddresses: tokenizedHsi,
  } as const
}

export const parseLogs = (interfaces: ethers.Interface[], logs: ethers.Log[]) => {
  const logDescriptions = _.map(logs, (log) => {
    for (const ntrface of interfaces) {
      try {
        ntrface.parseLog(log as any)
      } catch (err) {}
    }
  })
  return {
    all: logDescriptions,
    valid: _.compact(logDescriptions),
  }
}

export const fromStruct = (struct: any): any => {
  return _.mapValues(struct.toObject(), (val) => (
    val instanceof Result || Array.isArray(val)
      ? fromStruct(val)
      : val
  ))
}

export type DecodedCommunisPayoutInfo = ReturnType<typeof decodeCommunisPayoutInfo>

const ONE_TWENTY = 120n;
const MASK_120_BITS = (1n << ONE_TWENTY) - 1n;
const MASK_240_BITS = (1n << 240n) - 1n;

export const decodeCommunisPayoutInfo = (encodedValue: bigint) => {
  const nextPayoutDay = (encodedValue >> BigInt(240));
  const endBonusDebt = ((encodedValue & MASK_240_BITS) >> ONE_TWENTY);
  const stakedAmount = (encodedValue & MASK_120_BITS);

  return { nextPayoutDay, endBonusDebt, stakedAmount };
}
