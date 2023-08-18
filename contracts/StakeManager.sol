// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import "./TransferrableStakeManager.sol";
import "./EarningsOracle.sol";

contract StakeManager is TransferrableStakeManager, EarningsOracle {
  constructor() EarningsOracle(1, 0) {}
}
