// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./SignatureStakeManager.sol";

contract StakeManager is SignatureStakeManager {
  constructor() SignatureStakeManager() {}
}
