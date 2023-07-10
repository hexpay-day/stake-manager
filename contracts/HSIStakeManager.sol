// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IHedron.sol";
import "./IHEXStakeInstanceManager.sol";
import "./IHEX.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";
import "./IStakeable.sol";
import "./Magnitude.sol";
import "./Capable.sol";
import "./Bank.sol";

contract HSIStakeManager is UnderlyingStakeable, Magnitude, Capable, Bank {
  /**
   * a mapping of hsi addresses to the address that deposited the hsi into this contract
   */
  mapping(address => address) public hsiToOwner;
  mapping(address => uint256) public settings;
  /**
   * transfer stakes by their token ids
   * @param tokenId the token id to move to this contract
   * @dev requires approval to transfer hsi to this contract
   */
  function depositHsi(uint256 tokenId) external {
    address hsim = IHedron(hedron).hsim();
    address owner = _deposit721(hsim, tokenId);
    address hsiAddress = IHEXStakeInstanceManager(hsim).hexStakeDetokenize(tokenId);
    // erc721 is burned - no owner - only hsi address remains
    hsiToOwner[hsiAddress] = owner;
  }
  function _deposit721(address token, uint256 tokenId) internal returns(address owner) {
    owner = IERC721(token).ownerOf(tokenId);
    IERC721(token).transferFrom(msg.sender, address(this), tokenId);
  }
  struct HSIParams {
    bool checkTip;
    uint96 hsiIndex;
    address hsiAddress;
  }
  /**
   * mint rewards and transfer them the owner of each hsi
   * @param params variable params for each call
   * @notice any combination of owners can be passed,
   * however, it is most efficient to order the hsi address by owner
   */
  function mintRewards(HSIParams[] calldata params) external {
    uint256 len = params.length;
    uint256 i;
    uint256 hedronTokens;
    address hsiAddress = params[0].hsiAddress;
    address currentOwner;
    address to = hsiToOwner[hsiAddress];
    do {
      hsiAddress = params[i].hsiAddress;
      currentOwner = hsiToOwner[hsiAddress];
      if (currentOwner != to) {
        IERC20(hedron).transfer(to, hedronTokens);
        hedronTokens = 0;
      }
      to = currentOwner;
      hedronTokens += IHedron(hedron).mintInstanced(params[i].hsiIndex, hsiAddress);
      unchecked {
        ++i;
      }
    } while (i < len);
    if (hedronTokens > 0) {
      IERC20(hedron).transfer(to, hedronTokens);
    }
  }
  /**
   * end multiple stakes, and mint final tokens
   * @param params the hsi index and address to interact with
   */
  function hsiStakeEndMany(HSIParams[] calldata params) external {
    uint256 len = params.length;
    uint256 targetTokens;
    uint256 hedronTokens;
    uint256 i;
    address hsiAddress;
    uint256 index;
    address currentOwner;
    address hsim = IHedron(hedron).hsim();
    do {
      hsiAddress = params[i].hsiAddress;
      currentOwner = hsiToOwner[hsiAddress];
      index = params[i].hsiIndex;
      IStakeable.StakeStore memory stake = IHEX(target).stakeLists(hsiAddress, 0);
      uint256 hedronReward = IHedron(hedron).mintInstanced(index, hsiAddress);
      uint256 targetReward = IHEXStakeInstanceManager(hsim).hexStakeEnd(index, hsiAddress);
      uint256 setting = settings[hsiAddress];
      if (_isCapable(setting, 0)) {
        uint256 ethLimit = withdrawableBalanceOf[address(0)][currentOwner];
        uint256 etherTip = _checkTipAmount(setting >> 8, ethLimit, stake);
        if (etherTip > 0) {
          unchecked {
            withdrawableBalanceOf[address(0)][currentOwner] = ethLimit - etherTip;
            attributed[address(0)] -= etherTip;
          }
        }
      }
      if (_isCapable(setting, 1)) {
        uint256 hedronTip = _checkTipAmount(setting >> 80, hedronTokens, stake);
        if (hedronTip > 0) {
          unchecked {
            hedronTokens -= hedronTip;
          }
        }
      }
      if (_isCapable(setting, 2)) {
        uint256 targetTip = _checkTipAmount(setting >> 152, targetTokens, stake);
        if (targetTip > 0) {
          unchecked {
            targetTokens -= targetTip;
          }
        }
      }
      if (hedronReward > 0) {
        unchecked {
          withdrawableBalanceOf[hedron][currentOwner] += hedronReward;
        }
      }
      if (targetReward > 0) {
        unchecked {
          withdrawableBalanceOf[target][currentOwner] += targetReward;
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  function setSettings(address hsiAddress, uint256 setting) external {
    if (hsiToOwner[hsiAddress] != msg.sender) {
      revert NotAllowed();
    }
    settings[hsiAddress] = uint224(setting);
  }
}
