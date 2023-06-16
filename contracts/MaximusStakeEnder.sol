// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IPublicEndStakeable.sol";
import "./AuthorizationManager.sol";
import "./Multicall.sol";
import { IGasReimberser } from './GasReimberser.sol';

contract MaximusStakeEnder is Ownable2Step, AuthorizationManager {
  using Address for address payable;
  constructor(address owner) AuthorizationManager(7) {
    _setAddressAuthorization(owner, MAX_AUTHORIZATION);
    _transferOwnership(owner);
  }
  function isAuthorized(address runner, uint256 index) external view returns(bool) {
    return _isAddressAuthorized(runner, index);
  }
  function setAuthorization(address target, uint256 setting) external onlyOwner {
    _setAddressAuthorization(target, setting);
  }
  function stakeEnd(address target, uint256 stakeId) external senderIsAuthorized(0) {
    IPublicEndStakeable(target).endStakeHEX(0, uint40(stakeId));
  }
  function flushNative(address target) external senderIsAuthorized(1) {
    IGasReimberser(target).flush();
  }
  function flushErc20(address target, address token) external senderIsAuthorized(1) {
    IGasReimberser(target).flush_erc20(token);
  }
  function withdrawNative(
    address payable recipient,
    uint256 amount
  ) external senderIsAuthorized(2) {
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
  ) external senderIsAuthorized(2) {
    uint256 bal = IERC20(token).balanceOf(address(this));
    amount = amount == 0 || amount > bal ? bal : amount;
    if (amount > 0) {
      IERC20(token).transfer(recipient, amount);
    }
  }
}
