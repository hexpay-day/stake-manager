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
  function mintHedronRewards(uint256[] calldata stakeIds) external {
    uint256 len = stakeIds.length;
    uint256 i;
    uint256 hedronTokens;
    address currentOwner;
    address to = _stakeIdToOwner(stakeIds[0]);
    uint256 stakeIndex;
    do {
      (stakeIndex, currentOwner) = _stakeIdToInfo(stakeIds[i]);
      if (_checkCanMintHedronRewards(currentOwner, stakeIds[i])) {
        if (currentOwner != to) {
          _addToTokenWithdrawable(hedron, to, hedronTokens);
          hedronTokens = 0;
        }
        to = currentOwner;
        hedronTokens += _mintHedron(stakeIndex, stakeIds[i]);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      _addToTokenWithdrawable(hedron, to, hedronTokens);
    }
  }
  function _checkCanMintHedronRewards(address currentOwner, uint256 id) internal view virtual returns(bool) {
    return msg.sender == currentOwner || _isCapable(stakeIdToSettings[id], 2);
  }
  function _mintHedron(uint256 index, uint256 id) internal virtual returns(uint256 amount) {
    return _mintNativeHedron(index, id);
  }
  function _mintNativeHedron(uint256 index, uint256 stakeId) internal returns(uint256 amount) {
    return IHedron(hedron).mintNative(index, uint40(stakeId));
  }
  function _mintInstancedHedron(uint256 index, address hsiAddress) internal returns(uint256 amount) {
    return IHedron(hedron).mintInstanced(index, hsiAddress);
  }
}
