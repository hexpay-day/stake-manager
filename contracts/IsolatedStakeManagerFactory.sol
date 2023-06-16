// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IsolatedStakeManager.sol";

contract IsolatedStakeManagerFactory {
  event CreateIsolatedStakeManager(address owner, address instance);
  /**
   * @notice a mapping of a key that contains a modifier and the owning address
   * pointing to the address of the contract created by the stake manager
   */
  mapping(address => address) public isolatedStakeManagers;
  function upsertManager(address staker) external returns(address existing) {
    existing = isolatedStakeManagers[staker];
    if (existing != address(0)) {
      return existing;
    }
    // this scopes up to 2 stake managers to a single address
    // one that can only be ended by the staker one that can be ended by the stake manager
    existing = address(new IsolatedStakeManager{salt: keccak256(abi.encode(staker))}(staker));
    emit CreateIsolatedStakeManager(staker, existing);
    isolatedStakeManagers[staker] = existing;
  }
}
