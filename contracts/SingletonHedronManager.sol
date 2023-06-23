// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./EncodableSettings.sol";
import "./UnderlyingStakeManager.sol";

contract SingletonHedronManager is EncodableSettings, UnderlyingStakeManager {
  /**
   * @notice settings of stakes indexed by the stake id
   */
  mapping(address => uint256) public outstandingHedronTokens;
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
    address to = address(uint160(stakeIdInfo[stakeIds[0]]));
    uint256 stakeId;
    uint256 stakeInfo;
    do {
      stakeId = stakeIds[i];
      if (_isCapable(uint8(idToSettings[stakeId]), 2)) {
        stakeInfo = stakeIdInfo[stakeId];
        currentOwner = address(uint160(stakeInfo));
        if (currentOwner != to) {
          _attributeLegacyHedron(to, hedronTokens);
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += _mintLegacyNative(stakeInfo >> 160, stakeId);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _attributeLegacyHedron(to, hedronTokens);
    }
  }
  function _attributeLegacyHedron(address to, uint256 amount) internal {
    unchecked {
      outstandingHedronTokens[to] += amount;
    }
  }
  function _mintLegacyNative(uint256 index, uint256 stakeId) internal returns(uint256 amount) {
    return IHedron(hedron).mintNative(index, uint40(stakeId));
  }
  /**
   * send all or some subset of funds to a given address
   * @param to destination of funds attributed to sender
   * @param amount amount of funds to send. 0 defaults to all
   */
  function withdrawOutstandingHedron(address to, uint256 amount) external {
    uint256 max = outstandingHedronTokens[msg.sender];
    amount = amount == 0 || amount > max ? max : amount;
    outstandingHedronTokens[msg.sender] = max - amount;
    IERC20(hedron).transfer(to, amount);
  }
}