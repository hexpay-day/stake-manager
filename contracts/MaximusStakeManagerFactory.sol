// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./MaximusStakeManager.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";

contract MaximusStakeManagerFactory {
  event CreateMaximusStakeManager(address origination, uint256 index, address instance);
  mapping(bytes32 => address payable) public stakeManager;
  /**
   * end a stake on a provided perpetual contract
   * @param index the index of the salt to use (usually 0)
   * @param target the maximus perpetual contract to target
   * @param stakeId the stake id to pass to the maximus perpetual to end
   */
  function stakeEnd(uint256 index, address target, uint256 stakeId) external {
    _stakeEnd(msg.sender, index, target, stakeId);
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
  function stakeEndAs(address origination, uint256 index, address target, uint256 stakeId) external {
    _stakeEnd(origination, index, target, stakeId);
  }
  /**
   * calls the stakeEnd method on the underlying stake manager
   * @param origination the address to provide the fee to
   * @param index the index of the salt to use (usually 0)
   * @param target the maximus perpetual contract to target
   * @param stakeId the stake id to pass to the maximus perpetual to end
   */
  function _stakeEnd(address origination, uint256 index, address target, uint256 stakeId) internal {
    MaximusStakeManager(_createStakeManager(origination, index)).stakeEnd(target, stakeId);
  }
  /**
   * upsert a contract with a given address and index as the salt
   * @param origination the address that would be the origination salt of the stake manager
   * @param index the index of the salt to use (usually 0)
   */
  function createStakeManager(address origination, uint256 index) external returns(address payable) {
    return _createStakeManager(origination, index);
  }
  function stakeManagerByInput(address origination, uint256 index) external view returns(address payable) {
    return stakeManager[_stakeManagerKey(origination, index)];
  }
  function stakeManagerKey(address origination, uint256 index) external pure returns(bytes32) {
    return _stakeManagerKey(origination, index);
  }
  function _stakeManagerKey(address origination, uint256 index) internal pure returns(bytes32) {
    return keccak256(abi.encode(origination, index));
  }
  function _createStakeManager(
    address origination,
    uint256 index
  ) internal returns(address payable stakeManagerAddress) {
    bytes32 key = _stakeManagerKey(origination, index);
    stakeManagerAddress = stakeManager[key];
    if (stakeManagerAddress != address(0)) {
      return stakeManagerAddress;
    }
    stakeManagerAddress = payable(address(new MaximusStakeManager{salt: key}(origination)));
    stakeManager[key] = stakeManagerAddress;
    emit CreateMaximusStakeManager(origination, index, stakeManagerAddress);
  }
}
