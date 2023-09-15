import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ERC20 } from "../artifacts/types";
import { hexWhale } from "../src/config";

type Input = {
  impersonate: string;
  amount: string;
  decimal: string;
  to: string;
  token: string;
}

export const main = async (args: Input, hre: HardhatRuntimeEnvironment) => {
  const {
    impersonate,
    to,
    token,
  } = args
  let decimals = 18
  let tkn!: ERC20
  if (token !== hre.ethers.constants.AddressZero) {
    tkn = await hre.ethers.getContractAt('@openzeppelin/contracts/token/ERC20/ERC20.sol:ERC20', token) as ERC20
    tkn = tkn.connect(hre.ethers.provider)
    decimals = await tkn.decimals()
  }
  const amountInput = BigInt(args.amount)
  const decimalInput = hre.ethers.utils.parseUnits(args.decimal, decimals).toBigInt()
  const amount = amountInput || decimalInput
  // if you get a timeout error, try changing this to localhost or 127.0.0.1
  const provider = new hre.ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
  let account = provider.getSigner(0)
  if (impersonate !== 'no') {
    const impersonationTarget = impersonate || await hexWhale(hre)
    await provider.send("hardhat_impersonateAccount", [impersonationTarget])
    account = provider.getSigner(impersonationTarget)
  }
  if (token === hre.ethers.constants.AddressZero) {
    const balance = await hre.ethers.provider.getBalance(await account.getAddress())
    console.log('current balance of %o: %o', await account.getAddress(), hre.ethers.utils.formatEther(balance.toBigInt()))
    console.log('sending %o native to %o', hre.ethers.utils.formatEther(amount), to)
    await account.sendTransaction({
      to,
      type: 2,
      value: amount,
    })
  } else {
    tkn = tkn.connect(account)
    const symbol = await tkn.symbol()
    const balance = await tkn.balanceOf(await account.getAddress())
    const amnt = hre.ethers.utils.formatUnits(amount, decimals)
    console.log('current balance of %o: %o', await account.getAddress(), hre.ethers.utils.formatUnits(balance.toBigInt(), decimals))
    console.log('sending %o %o to %o', amnt, symbol, to)
    await tkn.transfer(to, amount, {
      type: 2,
    })
  }
}
