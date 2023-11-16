// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { Hedron } from "./interfaces/Hedron.sol";
import { UnderlyingStakeManager } from "./UnderlyingStakeManager.sol";
import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { Communis } from "./interfaces/Communis.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";

contract SingletonMintManager is UnderlyingStakeManager {
  /**
   * combine a boolean from a settings value and the owner address to
   * reduce the number of transfers / writes that occur during a loop
   * @param settings the settings to determine if a withdrawal should occur
   * @param owner the owner of the underlying stake
   * @return to the uint256 representation of a single bit in settings and an owner address
   */
  function createTo(uint256 settings, address owner) external pure returns(uint256 to) {
    return _createTo({
      settings: settings,
      owner: owner
    });
  }
  function _createTo(uint256 settings, address owner) internal pure returns(uint256 to) {
    unchecked {
      return (uint256(_isOneAtIndex({
        settings: settings,
        index: INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER
      }) ? ONE : ZERO) << ADDRESS_BIT_LENGTH) | uint160(owner);
    }
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
    uint256 settings = stakeIdToSettings[stakeId];
    uint256 to = _createTo(settings, _stakeIdToOwner({
      stakeId: stakeIds[ZERO]
    }));
    unchecked {
      do {
        stakeId = stakeIds[i];
        (stakeIndex, currentOwner) = _stakeIdToInfo({
          stakeId: stakeId
        });
        settings = stakeIdToSettings[stakeId];
        if (msg.sender == currentOwner || _isOneAtIndex({
          settings: settings,
          index: INDEX_RIGHT_CAN_MINT_HEDRON
        })) {
          uint256 currentTo = _createTo(settings, currentOwner);
          if (currentTo != to) {
            _attributeFunds({
              settings: settings,
              token: HEDRON,
              staker: address(uint160(to)),
              amount: hedronTokens
            });
            hedronTokens = ZERO;
          }
          to = currentTo;
          hedronTokens += _mintHedron({
            index: stakeIndex,
            stakeId: stakeId
          });
        }
        ++i;
      } while (i < len);
      if (hedronTokens > ZERO) {
        _attributeFunds({
          settings: settings,
          token: HEDRON,
          staker: address(uint160(to)),
          amount: hedronTokens
        });
      }
    }
  }
  /**
   * mint native hedron for a given stake id
   * @param index the index of the native stake to mint
   * @param stakeId the stake id to mint
   */
  function _mintHedron(uint256 index, uint256 stakeId) internal virtual returns(uint256 amount) {
    return Hedron(HEDRON).mintNative(index, uint40(stakeId));
  }
  /**
   * overridable noop method for minting end bonus before ending a hex stake
   * @param settings the settings of the stake (just before it is ended)
   * @param today the day as an int (currentDay from hex)
   * @param index the index of the stake to find it in the stake list
   * @param staker the staker that will receive funds
   * @param referrer the referrer (tipTo) address
   * @param stake the in memory stake to use
   */
  function _communisStakeEndBonus(
    uint256 settings, uint256 today,
    uint256 index, address staker, address referrer,
    UnderlyingStakeable.StakeStore memory stake) internal virtual {}
}
