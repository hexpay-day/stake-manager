// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IPublicEndStakeable.sol";

contract StakeEnder {
  mapping(address => bool) public authorized;
  constructor(address owner) {
    authorized[msg.sender] = true;
    authorized[owner] = true;
  }
  function stakeEnd(address target, uint256 stakeId) public {
    if (!authorized[msg.sender]) {
      return;
    }
    IPublicEndStakeable(target).endStakeHEX(0, uint40(stakeId));
  }
  // add token distribution methods
}
