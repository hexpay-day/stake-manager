// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import "./interfaces/IHedron.sol";
import "./UnderlyingStakeManager.sol";

contract SingletonHedronManager is UnderlyingStakeManager {
  function createTo(uint256 setting, address owner) external pure returns(uint256 to) {
    return _createTo({
      setting: setting,
      owner: owner
    });
  }
  function _createTo(uint256 setting, address owner) internal pure returns(uint256 to) {
    return ((_isCapable({
      setting: setting,
      index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER
    }) ? ONE : ZERO) << ADDRESS_BIT_LENGTH) | uint160(owner);
  }
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
    uint256 setting = stakeIdToSettings[stakeId];
    uint256 to = _createTo(setting, _stakeIdToOwner({
      stakeId: stakeIds[ZERO]
    }));
    do {
      stakeId = stakeIds[i];
      (stakeIndex, currentOwner) = _stakeIdToInfo({
        stakeId: stakeId
      });
      setting = stakeIdToSettings[stakeId];
      if (msg.sender == currentOwner || _isCapable({
        setting: setting,
        index: INDEX_CAN_MINT_HEDRON
      })) {
        uint256 currentTo = _createTo(setting, currentOwner);
        if (currentTo != to) {
          _attributeFunds({
            setting: setting,
            index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER,
            token: HEDRON,
            staker: address(uint160(to)),
            amount: hedronTokens
          });
          hedronTokens = ZERO;
        }
        to = currentTo;
        unchecked {
          hedronTokens += _mintHedron({
            index: stakeIndex,
            stakeId: stakeId
          });
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > ZERO) {
      _attributeFunds({
        setting: setting,
        index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER,
        token: HEDRON,
        staker: address(uint160(to)),
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
    return IHedron(HEDRON).mintNative(index, uint40(stakeId));
  }
  function _mintInstancedHedron(uint256 index, address hsiAddress) internal returns(uint256 amount) {
    return IHedron(HEDRON).mintInstanced(index, hsiAddress);
  }
}
