// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGasReimberser {
  function flush() external;
  function flush_erc20(address token) external;
}

interface PoolContract {
  function getEndStaker() external view returns(address end_staker_address);
}

// this contract was modeled after the following tweet:
// https://twitter.com/TantoNomini/status/1630677746795057152
contract GasReimberser is IGasReimberser {
  using Address for address payable;
  address public immutable POOL_ADDRESS;
  constructor(address poolAddress) {
    POOL_ADDRESS = poolAddress;
  }
  receive() external payable {}
  function flush() external {
    PoolContract pc = PoolContract(POOL_ADDRESS);
    address payable ender = payable(pc.getEndStaker());
    require(msg.sender == ender, "Only End Staker can run this function.");
    uint256 amount = address(this).balance;
    if (amount > 0) {
      ender.sendValue(amount);
    }
  }
  function flush_erc20(address token_contract_address) external {
    PoolContract pc = PoolContract(POOL_ADDRESS);
    address ender = pc.getEndStaker();
    require(msg.sender == ender, "Only End Staker can run this function.");
    uint256 balance = IERC20(token_contract_address).balanceOf(address(this));
    if (balance > 0) {
      IERC20(token_contract_address).transfer(ender, balance);
    }
  }
}
