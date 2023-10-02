import { HardhatRuntimeEnvironment } from "hardhat/types"
import * as addresses from '../../../src/addresses'
import * as utils from '../../../src/utils'
import { IHedron } from "../../../artifacts/types"
import _ from "lodash"

type Input = {
  // address provided by signer
  approveIndividual: boolean;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const [signer] = await hre.ethers.getSigners()
  console.log('signer %o', signer.address)
  const hedron = await hre.ethers.getContractAt('contracts/interfaces/IHedron.sol:IHedron', addresses.Hedron) as IHedron
  const hsim = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim())
  const { tokenized, detokenized } = await hre.run('read:hsi:count', {
    address: signer.address,
  }) as { tokenized: bigint; detokenized: bigint; }
  console.log('count of %o hsi tokens and %o detokenized', tokenized, detokenized)
  const tokenIds = await Promise.all(_.range(0, Number(tokenized)).map(async (index) => {
    const tokenId = await hsim.tokenOfOwnerByIndex(signer.address, index)
    return tokenId.toBigInt()
  }))
  const approvalInfo = await utils.getHsiApprovals(
    signer.address,
    addresses.ExistingStakeManager,
    hsim,
    tokenIds,
  )
  console.log('approvedForAll %o', approvalInfo.all)
  console.log(approvalInfo.tokenIdToApproval)
  if (!approvalInfo.all) {
    if (!args.approveIndividual) {
      await utils.printTx(
        hsim.setApprovalForAll(addresses.ExistingStakeManager, true),
        'giving wide approval for %o',
        [addresses.ExistingStakeManager],
      )
    } else {
      const needsApproval = tokenIds.filter((tokenId) => !!approvalInfo.tokenIdToApproval.get(tokenId))
      for (const tokenId of needsApproval) {
        await utils.printTx(
          hsim.approve(addresses.ExistingStakeManager, tokenId),
          'giving individual approval to %o for token id %o',
          [addresses.ExistingStakeManager, tokenId],
        )
      }
    }
  }
  const existingStakeManager = await hre.ethers.getContractAt('ExistingStakeManager', addresses.ExistingStakeManager)
  // allow anyone to end stake
  // allow end stake to mint hedron
  const settings = 9
  const calls = tokenIds.map((tokenId) => (
    existingStakeManager.interface.encodeFunctionData('depositHsi', [tokenId, settings])
  ))
  await utils.printTx(
    existingStakeManager.multicall(calls, false),
    'depositing token ids %o into %o',
    [tokenIds, existingStakeManager.address],
  )
}
