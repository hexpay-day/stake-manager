// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IPublicEndStakeable.sol";
import "./AuthorizationManager.sol";
import "./Multicall.sol";
import { IGasReimberser } from './GasReimberser.sol';

contract MaximusStakeEnder is Multicall, Ownable, AuthorizationManager {
  using Address for address payable;
  constructor(address owner) AuthorizationManager(7) {}
  function stakeEnd(address target, uint256 stakeId) external {
    if (!checkBinary(authorization[bytes32(uint256(uint160(msg.sender)))], 0)) {
      return;
    }
    IPublicEndStakeable(target).endStakeHEX(0, uint40(stakeId));
  }
  function flushNative(address target) external addressIsAuthorized(msg.sender, 1) {
    IGasReimberser(target).flush();
  }
  function flushErc20(address target, address token) external addressIsAuthorized(msg.sender, 1) {
    IGasReimberser(target).flush_erc20(token);
  }
  function withdrawNative(
    address payable recipient,
    uint256 amount
  ) external addressIsAuthorized(msg.sender, 2) {
    uint256 bal = address(this).balance;
    amount = amount == 0 || amount > bal ? bal : amount;
    if (amount > 0) {
      recipient.sendValue(amount);
    }
  }
  function withdrawErc20(
    address recipient,
    address token,
    uint256 amount
  ) external addressIsAuthorized(msg.sender, 2) {
    uint256 bal = IERC20(token).balanceOf(address(this));
    amount = amount == 0 || amount > bal ? bal : amount;
    if (amount > 0) {
      IERC20(token).transfer(recipient, amount);
    }
  }
}
