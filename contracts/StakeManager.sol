// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./SingletonStakeManager.sol";

contract StakeManager is SingletonStakeManager {
  constructor() SingletonStakeManager() {}
}
