// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { Utils } from "../Utils.sol";
import { IGasReimberser } from "../interfaces/IGasReimberser.sol";
import { GasReimberserInstance } from "../interfaces/GasReimberserInstance.sol";
import { SafeTransferLib, ERC20 } from "solmate/src/utils/SafeTransferLib.sol";

// this contract was modeled after the following tweet:
// https://twitter.com/TantoNomini/status/1630677746795057152
contract GasReimberser is IGasReimberser, Utils {
  using SafeTransferLib for address;
  using SafeTransferLib for ERC20;
  address public immutable POOL_ADDRESS;
  constructor(address poolAddress) {
    POOL_ADDRESS = poolAddress;
  }
  receive() external payable {}
  function flush() external {
    GasReimberserInstance pc = GasReimberserInstance(POOL_ADDRESS);
    address ender = pc.getEndStaker();
    require(msg.sender == ender, "Only End Staker can run this function.");
    uint256 amount = address(this).balance;
    if (amount > ZERO) {
      ender.safeTransferETH(amount);
    }
  }
  function flush_erc20(address token_contract_address) external {
    GasReimberserInstance pc = GasReimberserInstance(POOL_ADDRESS);
    address ender = pc.getEndStaker();
    require(msg.sender == ender, "Only End Staker can run this function.");
    uint256 balance = ERC20(token_contract_address).balanceOf(address(this));
    if (balance > ZERO) {
      ERC20(token_contract_address).safeTransfer(ender, balance);
    }
  }
}
