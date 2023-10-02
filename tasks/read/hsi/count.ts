import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as utils from '../../../src/utils'
import * as addresses from '../../../src/addresses'
import { IHedron } from "../../../artifacts/types";

type Input = {
  address: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const hedron = await hre.ethers.getContractAt('contracts/interfaces/IHedron.sol:IHedron', addresses.Hedron) as IHedron
  const hsim = await hre.ethers.getContractAt('IHEXStakeInstanceManager', await hedron.hsim())
  return utils.countHsi(args.address, hsim)
}