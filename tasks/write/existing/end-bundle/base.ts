export const main = async () => {}
// import { HardhatRuntimeEnvironment, HttpNetworkUserConfig } from "hardhat/types";
// import * as config from '../../../../src/config'
// import * as addresses from '../../../../src/addresses'
// import * as utils from '../../../../src/utils'
// import { ExistingStakeManager, HEX, HEXStakeInstanceManager, IMulticall3 } from "../../../../artifacts/types";
// import _ from "lodash";
// import { Wallet, ethers } from "ethers";
// import { setNextBlockTimestamp } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time";
// import { StakeEndEvent, TransferEvent } from "../../../../artifacts/types/contracts/interfaces/HEX";
// import { HSIEndEvent } from "../../../../artifacts/types/contracts/interfaces/HEXStakeInstanceManager";
// import { FlashbotsBundleProvider, FlashbotsBundleTransaction } from '@flashbots/ethers-provider-bundle'
// import { setTimeout } from "timers/promises";

// type Input = {
//   sim: boolean;
//   mev: boolean;
//   wait: boolean;
// }

// // const secondsBetweenBlocks = new Map<number, number>([
// //   [1, 12],
// //   [369, 10],
// //   [943, 10],
// //   [31337, 10],
// // ])

// const waitUntil = async (hre: HardhatRuntimeEnvironment, secondsBefore = 10, target = new Date()) => {
//   let now = new Date()
//   if (+now >= +target) return
//   const msBefore = secondsBefore * 1_000
//   let block = await hre.ethers.provider.getBlock('latest')
//   while ((+target - msBefore) > (block.timestamp * 1_000)) {
//     console.log('waiting 3s for next block, current: %o @ %o', block.number, new Date(block.timestamp * 1_000))
//     await setTimeout(3_000)
//     block = await hre.ethers.provider.getBlock('latest')
//     // assume ~4s have passed
//   }
//   console.log('wait finished, current: %o @ %o', block.number, new Date(block.timestamp * 1_000))
// }

// export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
//   const [owner] = await hre.ethers.getSigners()
//   const runner = hre.ethers.Wallet.fromMnemonic(config.args.mnemonic, "m/44'/60'/0'/0/1").connect(hre.ethers.provider)
//   const balance = await runner.getBalance()
//   console.log('signer %o, balance %o', runner.address, hre.ethers.utils.formatEther(balance))
//   const hsim = await hre.ethers.getContractAt('HEXStakeInstanceManager', addresses.HSIM, runner) as HEXStakeInstanceManager
//   const multicall = await hre.ethers.getContractAt('IMulticall3', addresses.Multicall, runner) as IMulticall3
//   const hex = await hre.ethers.getContractAt('HEX', addresses.Hex, runner) as HEX
//   const existingStakeManager = await hre.ethers.getContractAt('ExistingStakeManager', addresses.ExistingStakeManager, runner)
//   const contracts = {
//     hex,
//     hsim,
//     existingStakeManager,
//     multicall,
//   }
//   // const perpetual = await hre.ethers.getContractAt('MockPerpetual', addresses.perpetualsByName.base)
//   // const period = await perpetual.getCurrentPeriod()
//   const baseStake = await hex.stakeLists(addresses.perpetualsByName.base, 0)
//   const exSMInterface = existingStakeManager.interface
//   const createEndBaseStakeCall = () => exSMInterface.encodeFunctionData('stakeEndAs', [
//     owner.address,
//     addresses.perpetualsByName.base,
//     baseStake.stakeId,
//   ])
//   const endBaseStakeCall = createEndBaseStakeCall()
//   const result = await utils.loadHsiFrom(existingStakeManager.address, contracts)
//   const whitelist = [
//     owner.address,
//   ].map((addr) => hre.ethers.utils.getAddress(addr))
//   const orderedAddresses = result.detokenizedAddresses.slice().reverse()
//   const onWhitelist = await Promise.all(orderedAddresses.map(async (hsiAddress) => {
//     const owner = await existingStakeManager.stakeIdToOwner(hsiAddress)
//     return whitelist.includes(hre.ethers.utils.getAddress(owner))
//   }))
//   const whitelistedHsiAddresses = orderedAddresses.filter((_hsiAddr, index) => onWhitelist[index])
//   const endHsiStakesCall = exSMInterface.encodeFunctionData('hsiStakeEndMany', [whitelistedHsiAddresses])
//   const sequentialCalls: string[] = [
//     endBaseStakeCall,
//     endHsiStakesCall,
//   ]
//   const targetTimestamp = new Date('2023-10-02')
//   const minimumEndTimeSeconds = Math.floor(+targetTimestamp / 1_000)
//   const finalCalldata = whitelistedHsiAddresses.length
//     ? exSMInterface.encodeFunctionData('multicall', [sequentialCalls, false])
//     : createEndBaseStakeCall()
//   console.log('ending %o hsis', whitelistedHsiAddresses.length)
//   const gasLimit = whitelistedHsiAddresses.length ? 2586530n : 1396220n
//   const latest = await runner.getTransactionCount('latest')
//   const options = {
//     calldata: finalCalldata,
//     sim: args.sim,
//     wait: args.wait,
//     minimumEndTimeSeconds,
//     gasLimit,
//     runner,
//     contracts,
//     nonce: latest,
//   }
//   if (args.mev) {
//     // use flashbots
//     if (args.wait) {
//       await waitUntil(hre, 60, targetTimestamp)
//     }
//     await mevRpc(hre, options)
//   } else {
//     if (args.wait) {
//       await waitUntil(hre, 8, targetTimestamp)
//     }
//     await directRpc(hre, options)
//   }
// }

// type Contracts = {
//   existingStakeManager: ExistingStakeManager;
//   hex: HEX;
//   hsim: HEXStakeInstanceManager;
// }

// type SendTx = {
//   minimumEndTimeSeconds: number;
//   sim: boolean;
//   wait: boolean;
//   gasLimit: bigint;
//   runner: Wallet;
//   calldata: string;
//   contracts: Contracts;
//   nonce: number;
// }

// const mevRpc = async (hre: HardhatRuntimeEnvironment, {
//   minimumEndTimeSeconds,
//   sim,
//   runner,
//   gasLimit,
//   calldata,
//   nonce,
//   contracts,
// }: SendTx) => {
//   // use mev rpc
//   if (sim) {
//     // await setNextBlockTimestamp(minimumEndTimeSeconds)
//   }
//   const fbProvider = await FlashbotsBundleProvider.create(
//     hre.ethers.provider,
//     runner,
//     'https://rpc.flashbots.net',
//     1,
//   )
//   while (true) {
//     const block = await hre.ethers.provider.getBlock('latest')
//     const futureCount = 1
//     const feeInfo = [
//       block.baseFeePerGas,
//       block.gasUsed,
//       block.gasLimit,
//     ] as [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber]
//     const maxBaseFeeInFutureBlock = FlashbotsBundleProvider.getBaseFeeInNextBlock(...feeInfo).toBigInt()
//     const maxPriorityFeePerGas = maxBaseFeeInFutureBlock / 9n
//     const bundle: FlashbotsBundleTransaction[] = [{
//       signer: runner,
//       transaction: {
//         chainId: 1,
//         to: contracts.existingStakeManager.address,
//         type: 2,
//         data: calldata,
//         maxFeePerGas: maxPriorityFeePerGas + maxBaseFeeInFutureBlock,
//         maxPriorityFeePerGas,
//         gasLimit: (gasLimit * 3n) / 2n,
//         value: 0,
//         nonce,
//       },
//     }]
//     if (sim) {
//       const signed = await fbProvider.signBundle(bundle)
//       const simulated = await fbProvider.simulate(signed, 'latest', block.number, minimumEndTimeSeconds)
//       console.log(simulated)
//     } else {
//       const tx = await fbProvider.sendBundle(bundle, block.number + futureCount, {
//         minTimestamp: minimumEndTimeSeconds,
//       })
//       if ('error' in tx) {
//         console.log(tx)
//       } else {
//         await tx.wait().catch((err) => {
//           console.log('tx failed to be mined', err)
//         })
//       }
//     }
//     const nextBlock = await hre.ethers.provider.getBlock('latest')
//     if (nextBlock.number === block.number) {
//       await waitUntil(hre, 0, new Date((block.timestamp + 12) * 1000))
//     }
//   }
// }

// const directRpc = async (hre: HardhatRuntimeEnvironment, {
//   minimumEndTimeSeconds,
//   sim,
//   runner,
//   calldata,
//   gasLimit,
//   contracts,
//   nonce,
// }: SendTx) => {
//   // use direct rpc
//   if (sim && hre.network.name === 'hardhat') {
//     console.log('shifting block timestamp to %o', new Date(minimumEndTimeSeconds * 1_000))
//     await setNextBlockTimestamp(minimumEndTimeSeconds)
//   }
//   const block = await hre.ethers.provider.getBlock('latest')
//   const maxFeePerGas = (block.baseFeePerGas?.toBigInt() as bigint) * 2n
//   const maxPriorityFeePerGas = maxFeePerGas / 20n
//   // const estimatedGas = await runner.estimateGas({
//   //   data: calldata,
//   //   to: contracts.existingStakeManager.address,
//   // })
//   // const gas = estimatedGas.toBigInt()
//   // console.log('gas %o', gas)
//   // const gas = 2586530n
//   console.log('estimated gas %o', gasLimit)
//   const tx = await runner.sendTransaction({
//     data: calldata,
//     to: contracts.existingStakeManager.address,
//     gasLimit: (gasLimit * 3n) / 2n,
//     maxFeePerGas,
//     maxPriorityFeePerGas,
//     nonce,
//   })
//   const receipt = await tx.wait()
//   await describeResult(receipt, contracts)
//   // await hre.run('trace', {
//   //   hash: receipt.transactionHash,
//   //   fulltrace: true,
//   //   nocompile: true,
//   //   vvvv: true,
//   // })
// }

// const describeResult = async (receipt: ethers.providers.TransactionReceipt, { existingStakeManager, hex, hsim }: Contracts) => {
//   const logs = utils.parseLogs([existingStakeManager.interface, hex.interface, hsim.interface], receipt.logs)
//   const block = await existingStakeManager.provider.getBlock(receipt.blockHash)
//   const timestamp = new Date(block.timestamp * 1_000)
//   const descriptionToLog = new Map<ethers.utils.LogDescription, ethers.providers.Log>(
//     _.zip(logs.all, receipt.logs) as [ethers.utils.LogDescription, ethers.providers.Log][]
//   )
//   console.log('at %o, %o gas was used', timestamp, receipt.gasUsed.toBigInt())
//   // const perpetualEnds =
//   const printHedron = (end: any) => {
//     let index = logs.valid.indexOf(end)
//     while (--index >= 0) {
//       const target = logs.valid[index]
//       if (target.name === 'Transfer' && target.args.from === ethers.constants.AddressZero) {
//         const hsiMintTransfer = target as unknown as TransferEvent
//         console.log('minted %o hedron, then', ethers.utils.formatUnits(hsiMintTransfer.args.value, 9))
//         return
//         // presume hedron is the last transfer
//       }
//     }
//   }
//   _.forEach(logs.valid, (log) => {
//     if (addresses.perpetuals.has((log as unknown as StakeEndEvent).args.stakerAddr)) {
//       printHedron(log)
//       console.log('ended perpetual %o (%o)', addresses.perpetualToName[log.args.stakerAddr], log.args.stakerAddr)
//       return
//     }
//     if (log.name === 'HSIEnd') {
//       const hsiEnd: HSIEndEvent = log as any
//       printHedron(log)
//       console.log('hsi ended %o -> %o', hsiEnd.args.hsiAddress, hsiEnd.args.staker)
//     }
//     if (log.name === 'Transfer' && log.args.from !== ethers.constants.AddressZero && log.args.to !== ethers.constants.AddressZero) {
//       const transfer: TransferEvent = log as any
//       console.log('transfer %o %o from %o to %o', descriptionToLog.get(log)?.address,
//         transfer.args.value.toBigInt(), transfer.args.from, transfer.args.to)
//     }
//   })
// }
