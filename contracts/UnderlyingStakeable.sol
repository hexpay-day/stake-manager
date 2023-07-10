// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHEX.sol";
import "./Multicall.sol";

contract UnderlyingStakeable is Multicall {
  address public constant target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public constant hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  error NotAllowed();
  function stakeCount(address staker) external view returns(uint256) {
    return _stakeCount(staker);
  }
  function _stakeCount(address staker) internal view returns(uint256) {
    return IHEX(target).stakeCount(staker);
  }
  function balanceOf(address owner) external view returns(uint256) {
    return _getBalance(owner);
  }
  function _getBalance(address owner) internal view returns(uint256) {
    return IERC20(target).balanceOf(owner);
  }
}
