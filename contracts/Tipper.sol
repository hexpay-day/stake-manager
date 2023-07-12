// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./UnderlyingStakeable.sol";
import "./Bank.sol";
import "./CurrencyList.sol";
import "./StakeInfo.sol";
import "./EncodableSettings.sol";

contract Tipper is Bank, UnderlyingStakeable, CurrencyList, StakeInfo, EncodableSettings {
  constructor()
    Bank()
    UnderlyingStakeable()
    CurrencyList()
    StakeInfo()
    EncodableSettings()
  {
    _addCurrencyToList(address(0));
    // this line allows hex to be tipped by factor of basefee
    _addCurrencyToList(target);
    _addCurrencyToList(hedron);
  }
  uint256 public constant MAX_256 = type(uint256).max;
  mapping(uint256 => address) internal _tipStakeIdToStaker;
  event AddTip(
    uint256 indexed stakeId,
    address indexed token,
    uint256 indexed index,
    uint256 setting
  );
  event RemoveTip(
    uint256 indexed stakeId,
    address indexed token,
    uint256 indexed index,
    uint256 setting
  );
  mapping(uint256 => uint256[]) public stakeIdTips;
  function stakeIdTipSize(uint256 stakeId) external view returns(uint256) {
    return stakeIdTips[stakeId].length;
  }
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
      // tips get executed in reverse order so that the contract
      // can clean itself up (gas refund) as it goes along
      uint256 tip = stakeIdTips[stakeId][len - 1 - i];
      stakeIdTips[stakeId].pop();
      address token = indexToToken[tip >> 224];
      if (uint128(tip) == 0) {
        tip = uint96(tip >> 128);
      } else {
        uint256 limit = uint96(tip >> 128);
        tip = (uint64(tip >> 64) * block.basefee) / uint64(tip);
        tip = _clamp(tip, limit);
        uint256 refund = limit - tip;
        if (refund > 0) {
          // put back unused tip
          unchecked {
            withdrawableBalanceOf[token][staker] += refund;
          }
        }
      }
      if (tip > 0) {
        emit Tip(stakeId, staker, token, tip);
        // this allows the tip to be free floating
        // and picked up by lower level, "unattributed" methods
        unchecked {
          attributed[token] -= tip;
        }
      }
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  /**
   * encodes a series of data in 32+96+64+64 to fit into 256 bits to define
   * how a tip should be executed
   * @param currencyIndex the index of the currency on the list
   * @param amount the number of tokens to delineate as tips
   * @param numerator the numerator for ratio
   * @param denominator the denominator of the ratio
   */
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
    if (numerator > 0 && denominator == 0) {
      revert NotAllowed();
    }
    return (currencyIndex << 224)
      | (amount << 128)
      | (uint256(uint64(numerator)) << 64)
      | uint256(uint64(denominator));
  }
  function depositAndAddTipToStake(
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external payable returns(uint256, uint256) {
    amount = _depositTokenFrom(token, msg.sender, amount);
    address recipient = _verifyTipAmountAllowed(stakeId, amount);
    _addToTokenWithdrawable(token, recipient, amount);
    // do now allow for overriding of tip settings, only increase in gas token
    return _addTipToStake(token, recipient, stakeId, amount, numerator, denominator);
  }
  function removeTipFromStake(
    uint256 stakeId,
    uint256[] calldata indexes
  ) external payable {
    // if the stake has already ended, we don't care
    // who sends funds back to staking address
    // only one who is incensed to unwind tips is the staker
    // but realistically, anyone can if they wish
    address staker;
    if (stakeIdInfo[stakeId] != 0) {
      _verifyStakeOwnership(msg.sender, stakeId);
      staker = msg.sender;
    } else {
      staker = _tipStakeIdToStaker[stakeId];
    }
    uint256[] storage tips = stakeIdTips[stakeId];
    // this will fail if no tips exist
    uint256 tipsLast = tips.length - 1;
    uint256 len = indexes.length;
    uint256 i;
    do {
      uint256 index = indexes[i];
      uint256 tip = tips[index];
      if (tipsLast > 0) {
        tips[index] = tips[tipsLast];
      }
      tips.pop();
      // now do something with the tip
      address token = address(indexToToken[tip >> 224]);
      _addToTokenWithdrawable(
        token,
        staker,
        uint96(tip >> 128)
      );
      emit RemoveTip(stakeId, token, index, tip);
      unchecked {
        // this overflows when tips are empty
        --tipsLast;
        ++i;
      }
    } while (i < len);
    if (tipsLast == MAX_256) {
      // remove from settings
      uint256 setting = stakeIdToSettings[stakeId];
      _logSettingsUpdate(stakeId, (setting >> 8 << 8) | uint8(setting << 2) >> 2);
    }
  }
  function addTipToStake(
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external returns(uint256, uint256) {
    _verifyTipAmountAllowed(stakeId, amount);
    // deduct from sender account
    return _addTipToStake(token, msg.sender, stakeId, amount, numerator, denominator);
  }
  function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns(address recipient) {
    (, recipient) = _stakeIdToInfo(stakeId);
    if (amount == 0 && msg.sender != recipient) {
      // cannot allow other people to take staker deposits
      revert NotAllowed();
    }
  }
  function _addTipToStake(
    address token,
    address account,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) internal returns(uint256 encodedSettings, uint256) {
    amount = _clamp(amount, withdrawableBalanceOf[token][account]);
    if (amount == 0) {
      return (0, 0);
    }
    if (_stakeCount(address(this)) == 0) {
      revert NotAllowed();
    }
    // cannot add a tip to a stake that has already ended
    // if (_stakeById(stakeId).stakeId != stakeId) {
    if (_getStake(address(this), _stakeIdToIndex(stakeId)).stakeId != stakeId) {
      revert NotAllowed();
    }
    _tipStakeIdToStaker[stakeId] = _stakeIdToOwner(stakeId);
    // set the tip flag to 1
    // 0b00000001 | 0b00010000 => 0b00010001
    // 0b00010001 | 0b00010000 => 0b00010001
    uint256 currentSettings = stakeIdToSettings[stakeId];
    uint256 updatedSettings = currentSettings | (1 << 6);
    if (updatedSettings != currentSettings) {
      _logSettingsUpdate(stakeId, updatedSettings);
    }
    if (amount > 0) {
      unchecked {
        withdrawableBalanceOf[token][account] -= amount;
        // settings must be provided with each addition
        // this result provides 15*basefee/2, up to 10m hedron as a contrived example
        // 0x0000000200000000002386f26fc10000000000000000000f0000000000000002
      }
    }
    uint256 currencyIndex = currencyToIndex[token];
    if (currencyIndex == 0 && token != address(0)) {
      revert NotAllowed();
    }
    uint256 setting = _encodeTipSettings(currencyIndex, amount, numerator, denominator);
    uint256 index = stakeIdTips[stakeId].length;
    stakeIdTips[stakeId].push(setting);
    emit AddTip(stakeId, token, index, setting);
    return (index, amount);
  }
}
