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
  let decimals = 18n
  let tkn!: ERC20
  if (token !== hre.ethers.ZeroAddress) {
    tkn = await hre.ethers.getContractAt('solmate/src/tokens/ERC20.sol:ERC20', token) as unknown as ERC20
    tkn = tkn.connect(hre.ethers.provider)
    decimals = await tkn.decimals()
  }
  const amountInput = BigInt(args.amount)
  const decimalInput = hre.ethers.parseUnits(args.decimal, decimals)
  const amount = amountInput || decimalInput
  // if you get a timeout error, try changing this to localhost or 127.0.0.1
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545/")
  let account = await provider.getSigner(0)
  if (impersonate !== 'no') {
    const impersonationTarget = impersonate || await hexWhale(tkn)
    await provider.send("hardhat_impersonateAccount", [impersonationTarget])
    account = await provider.getSigner(impersonationTarget)
  }
  if (token === hre.ethers.ZeroAddress) {
    const balance = await hre.ethers.provider.getBalance(await account.getAddress())
    console.log('current balance of %o: %o', await account.getAddress(), hre.ethers.formatEther(balance))
    console.log('sending %o native to %o', hre.ethers.formatEther(amount), to)
    await account.sendTransaction({
      to,
      type: 2,
      value: amount,
    })
  } else {
    tkn = tkn.connect(account)
    const symbol = await tkn.symbol()
    const balance = await tkn.balanceOf(await account.getAddress())
    const amnt = hre.ethers.formatUnits(amount, decimals)
    console.log('current balance of %o: %o', await account.getAddress(), hre.ethers.formatUnits(balance, decimals))
    console.log('sending %o %o to %o', amnt, symbol, to)
    await tkn.transfer(to, amount, {
      type: 2,
    })
  }
}
