// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./MaximusStakeManager.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";

contract MaximusStakeManagerFactory {
  event CreateMaximusStakeManager(address owner, address instance);
  mapping(address => address) public stakeEnder;
  /**
   * end a stake on a provided perpetual contract
   * @param index the index of the salt to use (usually 0)
   * @param target the maximus perpetual contract to target
   * @param stakeId the stake id to pass to the maximus perpetual to end
   */
  function endPublicStake(uint256 index, address target, uint256 stakeId) external {
    _endPublicStake(msg.sender, index, target, stakeId);
  }
  /**
   * end the public stake on a provided perpetual contract
   * @param origination the address to provide the fee to
   * @param index the index of the salt to use (usually 0)
   * @param target the maximus perpetual contract to target
   * @param stakeId the stake id to pass to the maximus perpetual to end
   * @notice the fee to address is used in leu of the sender
   * this allows calls from public multicall contracts to be utilized
   */
  function endPublicStakeAs(address origination, uint256 index, address target, uint256 stakeId) external {
    _endPublicStake(origination, index, target, stakeId);
  }
  /**
   * calls the stakeEnd method on the underlying stake manager
   * @param origination the address to provide the fee to
   * @param index the index of the salt to use (usually 0)
   * @param target the maximus perpetual contract to target
   * @param stakeId the stake id to pass to the maximus perpetual to end
   */
  function _endPublicStake(address origination, uint256 index, address target, uint256 stakeId) internal {
    MaximusStakeManager(_createStakeManager(origination, index)).stakeEnd(target, stakeId);
  }
  /**
   * upsert a contract with a given address and index as the salt
   * @param origination the address that would be the origination salt of the stake manager
   * @param index the index of the salt to use (usually 0)
   */
  function createStakeManager(address origination, uint256 index) external returns(address) {
    return _createStakeManager(origination, index);
  }
  function _createStakeManager(address origination, uint256 index) internal returns(address stakeEnderAddress) {
    stakeEnderAddress = stakeEnder[origination];
    if (stakeEnderAddress != address(0)) {
      return stakeEnderAddress;
    }
    bytes32 salt = keccak256(abi.encode(origination, index));
    stakeEnderAddress = address(new MaximusStakeManager{salt: salt}(origination));
    stakeEnder[origination] = stakeEnderAddress;
    emit CreateMaximusStakeManager(origination, stakeEnderAddress);
  }
}
