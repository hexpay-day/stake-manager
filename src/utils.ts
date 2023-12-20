import { Result, ethers } from "ethers";
import { setTimeout } from "timers/promises";
import type { HEX, HEXStakeInstanceManager, Multicall, IUnderlyingStakeable } from "../artifacts/types";
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
  multicall: Multicall;
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
  const detokenizedStakes = allResults.slice(0, detokenizedCalls.length) as Multicall.ResultStructOutput[]
  const tokenizedStakes = allResults.slice(detokenizedCalls.length) as Multicall.ResultStructOutput[]
  const detokenizedAddresses = detokenizedStakes.map((result) => ethers.getAddress(`0x${result.returnData.slice(-40)}`))
  const tokenIds = tokenizedStakes.map((result) => BigInt(result.returnData))
  const tokenHsiCalls = tokenIds.map((tokenId) => (
    callHsim(hsim.interface.encodeFunctionData('hsiToken', [tokenId]))
  ))
  const tokenHsiResults = tokenHsiCalls ? await multicall.aggregate3.staticCall(tokenHsiCalls) : [] as Multicall.ResultStructOutput[]
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

export const decodeCommunisPayoutInfo = (encodedValue: bigint) => {
  const nextPayoutDay = (encodedValue >> 240n)
  const endBonusDebt = BigInt.asUintN(120, encodedValue >> 120n)
  const stakedAmount = BigInt.asUintN(119, encodedValue >> 1n)
  return {
    nextPayoutDay,
    endBonusDebt,
    stakedAmount,
    hasEnded: encodedValue % 2n === 1n,
  }
}

export const isOneAtIndex = (setting: bigint | number, index: bigint | number) => {
  return BigInt.asUintN(1, BigInt(setting) >> BigInt(index)) === 1n
}


export const calculateExpectedCommunisStakePayout = (
  stakedAmount: bigint,
  numberOfPayouts: bigint | number
) => {
  let expected = (stakedAmount * BigInt(numberOfPayouts)) / 80n
  if (expected > 1n) expected -= 1n
  return expected
}

type DeepPartial<T> = T extends object ? {
  [P in keyof T]?: DeepPartial<T[P]>;
} : T;

const MAX_UINT_8 = 256n
const MIN_INT_16 = -(2n**15n)
const ZERO = 0n
const ONE = 1n
const TWO = 2n
const THREE = 3n
const FOUR = 4n
const EIGHT = 8n
const SIXTEEN = 16n
const TWENTY_FOUR = 24n
const THIRTY_TWO = 32n
const FOURTY_EIGHT = 48n
const FIFTY_SIX = 56n
const SIXTY_FOUR = 64n
const SEVENTY_TWO = 72n
const X_OPTIONS = THREE
const SLOTS = MAX_UINT_8
const UNUSED_SPACE_RIGHT_UINT8 = SLOTS - EIGHT
const UNUSED_SPACE_RIGHT_UINT16 = SLOTS - SIXTEEN
const UNUSED_SPACE_RIGHT_UINT64 = SLOTS - SIXTY_FOUR
const INDEX_RIGHT_HEDRON_TIP = SLOTS - SEVENTY_TWO
const INDEX_RIGHT_TARGET_TIP = INDEX_RIGHT_HEDRON_TIP - SEVENTY_TWO
const INDEX_LEFT_TARGET_TIP = SLOTS - 144n
const INDEX_RIGHT_NEW_STAKE = INDEX_RIGHT_TARGET_TIP - SEVENTY_TWO
const INDEX_LEFT_NEW_STAKE = SLOTS - INDEX_RIGHT_NEW_STAKE
const INDEX_RIGHT_NEW_STAKE_DAYS_METHOD = THIRTY_TWO
const INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE = SIXTEEN
const INDEX_RIGHT_COPY_ITERATIONS = 9n
const INDEX_RIGHT_HAS_EXTERNAL_TIPS = EIGHT
const INDEX_RIGHT_MINT_COMMUNIS_AT_END = 7n
const INDEX_RIGHT_COPY_EXTERNAL_TIPS = 6n
const INDEX_RIGHT_STAKE_IS_TRANSFERABLE = 5n
const INDEX_LEFT_STAKE_IS_TRANSFERABLE = SLOTS - INDEX_RIGHT_STAKE_IS_TRANSFERABLE
const INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER = FOUR
const INDEX_RIGHT_CAN_MINT_HEDRON_AT_END = THREE
const INDEX_RIGHT_CAN_MINT_HEDRON = TWO
const INDEX_RIGHT_CAN_EARLY_STAKE_END = ONE
const INDEX_RIGHT_CAN_STAKE_END = ZERO

export const constants = {
  X_OPTIONS,
  MAX_UINT_8,
  ZERO,
  ONE,
  TWO,
  THREE,
  FOUR,
  EIGHT,
  SIXTEEN,
  THIRTY_TWO,
  SIXTY_FOUR,
  SEVENTY_TWO,
  SLOTS,
  UNUSED_SPACE_RIGHT_UINT8,
  UNUSED_SPACE_RIGHT_UINT16,
  UNUSED_SPACE_RIGHT_UINT64,
  INDEX_RIGHT_HEDRON_TIP,
  INDEX_RIGHT_TARGET_TIP,
  INDEX_LEFT_TARGET_TIP,
  INDEX_RIGHT_NEW_STAKE,
  INDEX_LEFT_NEW_STAKE,
  INDEX_RIGHT_NEW_STAKE_DAYS_METHOD,
  INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE,
  INDEX_RIGHT_COPY_ITERATIONS,
  INDEX_RIGHT_HAS_EXTERNAL_TIPS,
  INDEX_RIGHT_MINT_COMMUNIS_AT_END,
  INDEX_RIGHT_COPY_EXTERNAL_TIPS,
  INDEX_RIGHT_STAKE_IS_TRANSFERABLE,
  INDEX_LEFT_STAKE_IS_TRANSFERABLE,
  INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER,
  INDEX_RIGHT_CAN_MINT_HEDRON_AT_END,
  INDEX_RIGHT_CAN_MINT_HEDRON,
  INDEX_RIGHT_CAN_EARLY_STAKE_END,
  INDEX_RIGHT_CAN_STAKE_END,
}

export const defaultLinear = () => ({
  method: 0n,
  xFactor: 0n,
  x: 0n,
  yFactor: 0n,
  y: 0n,
  bFactor: 0n,
  b: 0n,
})

const decodeLinear = (linear: bigint) => {
  let method = BigInt.asUintN(8, linear)
  const xFactor = method / X_OPTIONS
  method %= X_OPTIONS
  if (xFactor === ZERO) {
    const y = BigInt.asUintN(56, linear >> EIGHT) << BigInt.asUintN(8, linear >> SIXTY_FOUR)
    return {
      ...defaultLinear(),
      method,
      xFactor,
      y,
    }
  }
  const x = BigInt.asUintN(16, linear >> FIFTY_SIX) + MIN_INT_16
  const yFactor = BigInt.asUintN(8, linear >> FOURTY_EIGHT)
  const y = BigInt.asUintN(16, linear >> THIRTY_TWO)
  const bFactor = BigInt.asUintN(8, linear >> TWENTY_FOUR)
  const b = BigInt.asUintN(16, linear >> EIGHT) + MIN_INT_16
  return {
    method,
    xFactor,
    x,
    yFactor,
    y,
    bFactor,
    b,
  }
}

type Linear = ReturnType<typeof decodeLinear>

const linearZero: Linear = {
  method: 0n,
  xFactor: 0n,
  yFactor: 0n,
  bFactor: 0n,
  x: 0n,
  y: 0n,
  b: 0n,
}

const encodeLinear = (decoded: Partial<Linear> = linearZero) => {
  if ((decoded.method || 0n) >= X_OPTIONS) throw new Error('NotAllowed')
  if (decoded.xFactor == ZERO) {
    return BigInt.asUintN(72, (
      (decoded.yFactor || 0n) << SIXTY_FOUR
      | (decoded.y || 0n) << EIGHT
      | (decoded.method || 0n)
    ))
  }
  return (
    (BigInt.asUintN(16, (decoded.x || 0n) - MIN_INT_16) << FIFTY_SIX)
    | (BigInt.asUintN(8, (decoded.yFactor || 0n)) << FOURTY_EIGHT)
    | (BigInt.asUintN(16, (decoded.y || 0n)) << THIRTY_TWO)
    | (BigInt.asUintN(8, (decoded.bFactor || 0n)) << TWENTY_FOUR)
    | (BigInt.asUintN(16, (decoded.b || 0n) - MIN_INT_16) << EIGHT)
    | (BigInt.asUintN(8, (decoded.xFactor || 0n) * X_OPTIONS) + (decoded.method || 0n))
  )
}

const decodeConsentAbilities = (abilities: bigint) => ({
  mintCommunisAtEnd: BigInt.asUintN(1, abilities >> INDEX_RIGHT_MINT_COMMUNIS_AT_END) == ONE,
  copyExternalTips: BigInt.asUintN(1, abilities >> INDEX_RIGHT_COPY_EXTERNAL_TIPS) == ONE,
  stakeIsTransferable: BigInt.asUintN(1, abilities >> INDEX_RIGHT_STAKE_IS_TRANSFERABLE) == ONE,
  shouldSendTokensToStaker: BigInt.asUintN(1, abilities >> INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER) == ONE,
  canMintHedronAtEnd: BigInt.asUintN(1, abilities >> INDEX_RIGHT_CAN_MINT_HEDRON_AT_END) == ONE,
  canMintHedron: BigInt.asUintN(1, abilities >> INDEX_RIGHT_CAN_MINT_HEDRON) == ONE,
  canEarlyStakeEnd: BigInt.asUintN(1, abilities >> INDEX_RIGHT_CAN_EARLY_STAKE_END) == ONE,
  canStakeEnd: BigInt.asUintN(1, abilities) == ONE,
})

/**
 * 00000001(0): can stake end
 * 00000010(1): can early stake end
 * 00000100(2): can mint hedron (any time)
 * 00001000(3): can mint hedron during end stake - future should be 0
 * 00010000(4): should send tokens to staker
 * 00100000(5): stake is transferable
 * 01000000(6): copy external tips to next stake
 * 10000000(7): mint comm tokens just before end
 */
const encodeConsentAbilities = (abilities: Partial<ReturnType<typeof decodeConsentAbilities>>) => (
  ((abilities.mintCommunisAtEnd ? ONE : ZERO) << INDEX_RIGHT_MINT_COMMUNIS_AT_END)
  | ((abilities.copyExternalTips ? ONE : ZERO) << INDEX_RIGHT_COPY_EXTERNAL_TIPS)
  | ((abilities.stakeIsTransferable ? ONE : ZERO) << INDEX_RIGHT_STAKE_IS_TRANSFERABLE)
  | ((abilities.shouldSendTokensToStaker ? ONE : ZERO) << INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER)
  | ((abilities.canMintHedronAtEnd ? ONE : ZERO) << INDEX_RIGHT_CAN_MINT_HEDRON_AT_END)
  | ((abilities.canMintHedron ? ONE : ZERO) << INDEX_RIGHT_CAN_MINT_HEDRON)
  | ((abilities.canEarlyStakeEnd ? ONE : ZERO) << INDEX_RIGHT_CAN_EARLY_STAKE_END)
  | (abilities.canStakeEnd ? ONE : ZERO)
)

const settingsDecode = (encoded: bigint) => ({
  hedronTip: decodeLinear(BigInt.asUintN(72, encoded >> INDEX_RIGHT_HEDRON_TIP)),
  // starts with full amount of end stake
  targetTip: decodeLinear(BigInt.asUintN(72, encoded >> INDEX_RIGHT_TARGET_TIP)),
  // the rest goes into a new stake if the number of days are set
  newStake: decodeLinear(BigInt.asUintN(72, encoded >> INDEX_RIGHT_NEW_STAKE)),
  newStakeDaysMethod: BigInt.asUintN(8, encoded >> INDEX_RIGHT_NEW_STAKE_DAYS_METHOD),
  newStakeDaysMagnitude: BigInt.asUintN(16, encoded >> INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE),
  // 0 for do not restart, 1-126 as countdown, 127 as restart indefinitely
  copyIterations: BigInt.asUintN(8, encoded >> INDEX_RIGHT_COPY_ITERATIONS),
  hasExternalTips: ((encoded >> INDEX_RIGHT_HAS_EXTERNAL_TIPS) % TWO) == ONE,
  consentAbilities: decodeConsentAbilities(BigInt.asUintN(8, encoded)),
})

/**
Settings(
  * by default, there is no hedron tip
  * assume that stakers will manage their own stakes at bare minimum
  Linear({
    method: ZERO,
    xFactor: ZERO,
    x: 0,
    yFactor: ZERO,
    y: ZERO,
    bFactor: ZERO,
    b: 0
  }),
  * by default, there is no target (hex) tip
  * assume that stakers will manage their own stakes at bare minimum
  Linear({
    method: ZERO,
    xFactor: ZERO,
    x: 0,
    yFactor: ZERO,
    y: ZERO,
    bFactor: ZERO,
    b: 0
  }),
  * by default, assume that all tokens minted from an end stake
  * should go directly into a new stake
  Linear({
    method: TWO,
    xFactor: ZERO,
    x: 0,
    yFactor: ZERO,
    y: ZERO,
    bFactor: ZERO,
    b: 0
  }),
  * by default, assume that by using this contract, users want efficiency gains
  * so by default, restarting their stakes are the most efficient means of managing tokens
  uint8(TWO), uint16(ZERO),
  uint8(MAX_UINT_7), restart forever
    * stakes do not start with external tips
    * tips can be added in the same tx via a multicall
  false,
  * by index: 00000001
  * 7: signal to ender that tips exist to be collected (allows contract to avoid an SLOAD) (0)
  * 6: should recreate external tips
  * 5: give dominion over hedron after tip to staker (0)
  * 4: give dominion over target after tip to staker (0)
  * 3: do not allow end hedron mint (0)
  * 2: do not allow continuous hedron mint (0)
  * 1: do not allow early end (0)
  * 0: allow end stake once days have been served (1)
  *
  * restarting is signalled by using settings above
  * no funds are ever pulled from external address
  * is ever allowed except by sender
  *
  * the reason why the hedron flags are 0 by default on the contract level is because
  * it may be worthwhile for hedron developers to build on top of this contract
  * and it is poor form to force people in the future to have to cancel out the past
  * front ends may choose to send a different default (non 0) during stake start
  ConsentAbilities({
    canStakeEnd: true,
    canEarlyStakeEnd: false,
    canMintHedron: false,
    canMintHedronAtEnd: false,
    shouldSendTokensToStaker: false,
    stakeIsTransferable: false,
    copyExternalTips: false,
    mintCommunisAtEnd: false
  })
);
*/
const settingsEncode = (decoded: DeepPartial<ReturnType<typeof settingsDecode>>) => (
  (encodeLinear(decoded.hedronTip) << INDEX_RIGHT_HEDRON_TIP)
  | (encodeLinear(decoded.targetTip) << INDEX_RIGHT_TARGET_TIP)
  | (encodeLinear(decoded.newStake) << INDEX_RIGHT_NEW_STAKE)
  | (BigInt.asUintN(8, decoded.newStakeDaysMethod || ZERO) << INDEX_RIGHT_NEW_STAKE_DAYS_METHOD)
  | (BigInt.asUintN(16, decoded.newStakeDaysMagnitude || ZERO) << INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE)
  | (BigInt.asUintN(8, decoded.copyIterations || ZERO) << INDEX_RIGHT_COPY_ITERATIONS)
  | (decoded.hasExternalTips ? (ONE << INDEX_RIGHT_HAS_EXTERNAL_TIPS) : ZERO)
  | encodeConsentAbilities(decoded.consentAbilities || {})
)

export const consentAbilities = {
  decode: decodeConsentAbilities,
  encode: encodeConsentAbilities,
}

export const linear = {
  decode: decodeLinear,
  encode: encodeLinear,
}

export const settings = {
  decode: settingsDecode,
  encode: settingsEncode,
}

export const clamp = (amount: bigint, max: bigint) => (
  amount === ZERO || amount > max ? max : amount
)

export const tipEncode = (reusable: boolean, currencyIndex: bigint, amount: bigint, linear: Linear) => {
  return (
    ((reusable ? 1n : 0n) << SLOTS)
    | BigInt.asUintN(55, currencyIndex) << 200n
    | BigInt.asUintN(128, amount) << 72n
    | encodeLinear(linear)
  )
}

export const tipDecode = (tip: bigint) => {
  return {
    reusable: BigInt.asUintN(1, tip >> SLOTS) === 1n,
    currencyIndex: BigInt.asUintN(55, tip >> 200n),
    amount: BigInt.asUintN(128, tip >> 72n),
    linear: decodeLinear(BigInt.asUintN(72, tip)),
  }
}
