import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as utils from '../../../src/utils'
import * as addresses from '../../../src/addresses'
import { ERC721, IHEXStakeInstanceManager, IHedron } from "../../../artifacts/types";

type Input = {
  address: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const hedron = await hre.ethers.getContractAt('IHedron', addresses.Hedron) as unknown as IHedron
  const hsim = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim()) as IHEXStakeInstanceManager
  const hsim721 = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim()) as unknown as ERC721
  return utils.countHsi(args.address, hsim, hsim721)
}