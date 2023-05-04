// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IUnderlyingStakeable.sol";

contract UnderlyingStakeable {
  function stakeCount(address custodian) external view returns(uint256) {
    return _stakeCount(custodian);
  }
  function _stakeCount(address custodian) internal view returns(uint256) {
    return IUnderlyingStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).stakeCount(custodian);
  }
}
