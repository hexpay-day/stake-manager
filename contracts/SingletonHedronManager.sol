// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./EncodableSettings.sol";
import "./UnderlyingStakeManager.sol";

contract SingletonHedronManager is EncodableSettings, UnderlyingStakeManager {
  /**
   * mint rewards and transfer them to a provided address
   * @param stakeIds list of stake ids to mint
   * @notice any combination of owners can be passed, however, it is most efficient to order the hsi address by owner
   */
  function mintRewardsFromStakeIds(uint64[] calldata stakeIds) external {
    uint256 len = stakeIds.length;
    uint256 i;
    uint256 hedronTokens;
    address currentOwner;
    address to = _stakeIdToOwner(stakeIds[0]);
    uint256 stakeId;
    uint256 stakeIndex;
    address hedronAddress = hedron;
    do {
      stakeId = stakeIds[i];
      if (_isCapable(stakeIdToSettings[stakeId], 2)) {
        (stakeIndex, currentOwner) = _stakeIdToInfo(stakeId);
        if (currentOwner != to) {
          _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
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
      _addToTokenWithdrawable(hedronAddress, to, hedronTokens);
    }
  }
  function _mintHedron(uint256 index, uint256 id) internal virtual returns(uint256) {
    return _mintNativeHedron(index, id);
  }
  function _mintNativeHedron(uint256 index, uint256 stakeId) internal returns(uint256 amount) {
    return IHedron(hedron).mintNative(index, uint40(stakeId));
  }
  function _mintInstancedHedron(uint256 index, address hsiAddress) internal returns(uint256 amount) {
    return IHedron(hedron).mintInstanced(index, hsiAddress);
  }
}
