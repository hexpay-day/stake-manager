// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { TransferableStakeManager } from "./TransferableStakeManager.sol";
import { EarningsOracle } from "./EarningsOracle.sol";

contract StakeManager is TransferableStakeManager, EarningsOracle {
  constructor() EarningsOracle(ONE, ZERO) {}
}
