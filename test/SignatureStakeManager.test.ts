// import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
// import { expect } from "chai"
// import * as hre from "hardhat"
// import * as utils from './utils'
// import _ from 'lodash'
// import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"
// import { TypedDataUtils } from "ethers-eip712"

// describe.only('SignatureStakeManager.sol', () => {
//   describe('updateSettingsBySignature', () => {
//     it('updates settings by providing a signature', async () => {
//       const x = await loadFixture(utils.deployFixture)
//       const [signerA, signerB] = x.signers
//       const network = await hre.ethers.provider.getNetwork()
//       const nextStakeId = await utils.nextStakeId(x)
//       await x.stakeManager.stakeStart(x.stakedAmount, 30)
//       await utils.moveForwardDays(31, x)
//       const settings = await x.stakeManager.defaultSettings()
//       const updatedSettings = {
//         ...settings,
//         consentAbilities: '15',
//       }
//       const updateSettingsData = {
//         types: {
//           // EIP712Domain: [
//           //   {name: "name", type: "string"},
//           //   {name: "version", type: "string"},
//           //   {name: "chainId", type: "uint256"},
//           //   {name: "verifyingContract", type: "address"},
//           // ],
//           UpdateSettings: [
//             { name: 'stakeId', type: 'uint256' },
//             { name: 'nonce', type: 'uint256' },
//             { name: 'settings', type: 'Setting' },
//           ],
//           Setting: [
//             // (uint8,uint64,uint8,uint64,uint8,uint64,uint8,uint16,uint8,uint8)
//             { name: 'tipMethod', type: 'uint8', },
//             { name: 'tipMagnitude', type: 'uint64', },
//             { name: 'withdrawableMethod', type: 'uint8', },
//             { name: 'withdrawableMagnitude', type: 'uint64', },
//             { name: 'newStakeMethod', type: 'uint8', },
//             { name: 'newStakeMagnitude', type: 'uint64', },
//             { name: 'newStakeDaysMethod', type: 'uint8', },
//             { name: 'newStakeDaysMagnitude', type: 'uint16', },
//             { name: 'copyIterations', type: 'uint8', },
//             { name: 'consentAbilities', type: 'uint8', },
//           ],
//         },
//         primaryType: 'UpdateSettings',
//         domain: {
//           name: 'SingletonStakeManager',
//           version: '0.0.0',
//           chainId: network.chainId,
//           verifyingContract: x.stakeManager.address,
//         },
//         message: {
//           stakeId: nextStakeId.toString(),
//           nonce: '0',
//           settings: {
//             tipMethod: settings.tipMethod,
//             tipMagnitude: settings.tipMagnitude,
//             withdrawableMethod: settings.withdrawableMethod,
//             withdrawableMagnitude: settings.withdrawableMagnitude,
//             newStakeMethod: settings.newStakeMethod,
//             newStakeMagnitude: settings.newStakeMagnitude,
//             newStakeDaysMethod: settings.newStakeDaysMethod,
//             newStakeDaysMagnitude: settings.newStakeDaysMagnitude,
//             copyIterations: settings.copyIterations,
//             consentAbilities: settings.consentAbilities,
//           },
//         },
//       }
//       // const digest = TypedDataUtils.encodeDigest(updateSettingsData)
//       // const digestHex = hre.ethers.utils.hexlify(digest)
//       const signature = await signerA._signTypedData(
//         updateSettingsData.domain,
//         updateSettingsData.types,
//         updateSettingsData.message
//       )
//       console.log(signerB.address)
//       await expect(x.stakeManager.connect(signerB).updateSettingsBySignature(nextStakeId.toString(), 0, updatedSettings, signature))
//         .to.emit(x.stakeManager, 'UpdatedSettings')
//     })
//   })
// })
