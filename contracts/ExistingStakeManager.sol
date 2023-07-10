// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./HSIStakeManager.sol";
import "./MaximusStakeManager.sol";

// in alphabetical order
contract ExistingStakeManager is HSIStakeManager, MaximusStakeManager {
  constructor() MaximusStakeManager() {}
}
