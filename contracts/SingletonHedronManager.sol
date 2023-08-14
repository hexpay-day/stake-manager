// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./IHedron.sol";
import "./UnderlyingStakeManager.sol";

contract SingletonHedronManager is UnderlyingStakeManager {
  /**
   * mint rewards and transfer them to a provided address
   * @param stakeIds list of stake ids to mint
   * @notice any combination of owners can be passed, however, it is most efficient to order the hsi address by owner
   */
  function mintHedronRewards(uint256[] calldata stakeIds) external {
    uint256 len = stakeIds.length;
    uint256 i;
    uint256 hedronTokens;
    address currentOwner;
    uint256 stakeIndex;
    uint256 stakeId;
    address to = _stakeIdToOwner({
      stakeId: stakeIds[0]
    });
    do {
      stakeId = stakeIds[i];
      (stakeIndex, currentOwner) = _stakeIdToInfo({
        stakeId: stakeId
      });
      if (msg.sender == currentOwner || _isCapable({
        setting: stakeIdToSettings[stakeId],
        index: 2
      })) {
        if (currentOwner != to) {
          _addToTokenWithdrawable({
            token: hedron,
            to: to,
            amount: hedronTokens
          });
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += _mintHedron({
          index: stakeIndex,
          stakeId: stakeId
        });
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _addToTokenWithdrawable({
        token: hedron,
        to: to,
        amount: hedronTokens
      });
    }
  }
  function _mintHedron(uint256 index, uint256 stakeId) internal virtual returns(uint256 amount) {
    return _mintNativeHedron({
      index: index,
      stakeId: stakeId
    });
  }
  function _mintNativeHedron(uint256 index, uint256 stakeId) internal returns(uint256 amount) {
    return IHedron(hedron).mintNative(index, uint40(stakeId));
  }
  function _mintInstancedHedron(uint256 index, address hsiAddress) internal returns(uint256 amount) {
    return IHedron(hedron).mintInstanced(index, hsiAddress);
  }
}
