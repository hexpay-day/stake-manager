// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./UnderlyingStakeable.sol";
import "./Bank.sol";

contract Tipper is UnderlyingStakeable, Bank {
  using Address for address;
  /**
   * @notice a global denoting the number of tokens attributed to addresses
   * @dev this value provides a useful "before" value whenever tokens are moving
   */
  address[] public indexToToken;
  mapping(uint256 => uint256[]) public stakeIdTips;
  mapping(address => uint256) public currencyToIndex;
  /**
   * tip an address a defined amount and token
   * @param stakeId the stake id being targeted
   * @param staker the staker
   * @param token the token being accounted
   * @param amount the amount of the token
   */
  event Tip(
    uint256 indexed stakeId,
    address indexed staker,
    address indexed token,
    uint256 amount
  );
  constructor() {
    _addCurrencyToTipList(address(0));
    // this line allows hex to be tipped by factor of basefee
    _addCurrencyToTipList(target);
    _addCurrencyToTipList(hedron);
  }
  function addCurrencyToTipList(address token) external {
    // token must already exist - helps prevent grief attacks
    if (!token.isContract()) {
      revert NotAllowed();
    }
    if (IERC20(token).totalSupply() > type(uint96).max) {
      revert NotAllowed();
    }
    _addCurrencyToTipList(token);
  }
  function _addCurrencyToTipList(address token) internal {
    currencyToIndex[token] = indexToToken.length;
    indexToToken.push(token);
  }
  function _checkAndExecTip(
    uint256 stakeId,
    address staker,
    address token,
    uint256 targetTip,
    uint256 delta
  ) internal returns(uint256) {
    // because we do not set a var for you
    // to collect unattributed tokens
    // it must be done at the end
    targetTip = targetTip > delta ? delta : targetTip;
    unchecked {
      delta = delta - targetTip;
    }
    emit Tip(stakeId, staker, token, targetTip);
    return delta;
  }
  function _executeTipList(uint256 stakeId, address staker) internal {
    uint256 i;
    uint256 len = stakeIdTips[stakeId].length;
    do {
      // the reason we can do this is because
      // it is unreasonable to try to provide a list of 0,
      // since nothing would be able to happen downstream
      uint256 tip = stakeIdTips[stakeId][len - 1 - i];
      stakeIdTips[stakeId].pop();
      address token = indexToToken[tip >> 224];
      if (uint128(tip) == 0) {
        tip = uint96(tip >> 128);
      } else {
        uint256 limit = uint96(tip >> 128);
        // after this point, the tip as written on chain
        // is not helpful to execution so we overwrite it
        if (limit > 0) {
          tip = (uint64(tip >> 64) * block.basefee) / uint64(tip);
          tip = _clamp(tip, limit);
          uint256 refund = limit - tip;
          if (refund > 0) {
            // put back unused tip
            unchecked {
              withdrawableBalanceOf[token][staker] += refund;
            }
          }
        } else {
          // we have to draw from deposited tokens
          tip = _clamp(tip, withdrawableBalanceOf[token][staker]);
          if (tip > 0) {
            unchecked {
              withdrawableBalanceOf[token][staker] -= tip;
            }
          }
        }
      }
      if (tip > 0) {
        emit Tip(stakeId, staker, token, tip);
        // this allows the tip to be free floating
        // and picked up by the unattributed methods
        unchecked {
          attributed[token] -= tip;
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  function encodeTipSettings(
    uint256 currencyIndex,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external pure returns(uint256) {
    return _encodeTipSettings(currencyIndex, amount, numerator, denominator);
  }
  function _encodeTipSettings(
    uint256 currencyIndex,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) internal pure returns(uint256) {
    return (currencyIndex << 224)
      | (amount << 128)
      | (uint256(uint64(numerator)) << 64)
      | uint256(uint64(denominator));
  }
}
