import { HardhatRuntimeEnvironment } from "hardhat/types";

type Input = {
  impersonate: string;
  amount: string;
  decimal: string;
  to: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const amountInput = BigInt(args.amount)
  const decimalInput = hre.ethers.utils.parseUnits(args.decimal, 8).toBigInt()
  const amount = amountInput || decimalInput
  const provider = new hre.ethers.providers.JsonRpcProvider("http://localhost:8545")
  await provider.send("hardhat_impersonateAccount", [args.impersonate])
  const account = provider.getSigner(args.impersonate)
  const hex = await hre.ethers.getContractAt('IHEX', '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', account)
  console.log('sending %o HEX to %o', hre.ethers.utils.formatUnits(amount, 8), args.to)
  await hex.transfer(args.to, amount)
}
