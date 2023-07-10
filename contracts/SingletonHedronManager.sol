// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./EncodableSettings.sol";
import "./UnderlyingStakeManager.sol";

contract SingletonHedronManager is EncodableSettings, UnderlyingStakeManager {
  // mint hedron rewards
  struct HedronParams {
    uint96 hsiIndex;
    address hsiAddress;
  }
  /**
   * mint rewards and transfer them to a provided address
   * @param stakeIds list of stake ids to mint
   * @notice any combination of owners can be passed, however, it is most efficient to order the hsi address by owner
   */
  function mintRewards(uint64[] calldata stakeIds) external {
    uint256 len = stakeIds.length;
    uint256 i;
    uint256 hedronTokens;
    address currentOwner;
    address to = _stakeIdToOwner(stakeIds[0]);
    uint256 stakeId;
    uint256 stakeIndex;
    do {
      stakeId = stakeIds[i];
      if (_isCapable(idToSettings[stakeId], 2)) {
        (stakeIndex, currentOwner) = _stakeIdToInfo(stakeId);
        if (currentOwner != to) {
          _attributeHedron(to, hedronTokens);
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += _mintNativeHedron(stakeIndex, stakeId);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _attributeHedron(to, hedronTokens);
    }
  }
  function _attributeHedron(address to, uint256 amount) internal {
    unchecked {
      withdrawableBalanceOf[hedron][to] += amount;
      attributed[hedron] += amount;
    }
  }
  function _mintNativeHedron(uint256 index, uint256 stakeId) internal returns(uint256 amount) {
    return IHedron(hedron).mintNative(index, uint40(stakeId));
  }
}
