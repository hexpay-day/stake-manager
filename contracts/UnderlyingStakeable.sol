// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IUnderlyingStakeable.sol";
import "./Multicall.sol";

contract UnderlyingStakeable is Multicall {
  address public constant target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public constant hedron = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  /**
   * @notice error is thrown when there is not enough funding to do the required operation
   */
  error NotEnoughFunding(uint256 provided, uint256 expected);
  error NotAllowed();
  function stakeCount(address custodian) external view returns(uint256) {
    return _stakeCount(custodian);
  }
  function _stakeCount(address custodian) internal view returns(uint256) {
    return IUnderlyingStakeable(target).stakeCount(custodian);
  }
}
