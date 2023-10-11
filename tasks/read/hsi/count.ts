import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as utils from '../../../src/utils'
import * as addresses from '../../../src/addresses'
import { ERC721, HEXStakeInstanceManager, Hedron } from "../../../artifacts/types";

type Input = {
  address: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const hedron = await hre.ethers.getContractAt('Hedron', addresses.Hedron) as unknown as Hedron
  const hsim = await hre.ethers.getContractAt('HEXStakeInstanceManager', await hedron.hsim()) as unknown as HEXStakeInstanceManager
  return utils.countHsi(args.address, hsim)
}