// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import "./TransferrableStakeManager.sol";
import "./EarningsOracle.sol";

contract StakeManager is TransferrableStakeManager, EarningsOracle {
  constructor() EarningsOracle(ONE, ZERO) {}
}
