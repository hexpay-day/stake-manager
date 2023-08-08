// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./UnderlyingStakeable.sol";
import "./Bank.sol";
import "./CurrencyList.sol";
import "./EncodableSettings.sol";

abstract contract Tipper is Bank, UnderlyingStakeable, CurrencyList, EncodableSettings {
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
  mapping(uint256 => uint256[]) public stakeIdTips;
  function stakeIdTipSize(uint256 stakeId) external view returns(uint256) {
    return _stakeIdTipSize({
      stakeId: stakeId
    });
  }
  function _stakeIdTipSize(uint256 stakeId) internal view returns(uint256) {
    return stakeIdTips[stakeId].length;
  }
  function _checkAndExecTip(
    uint256 stakeId,
    address staker,
    address token,
    uint256 amount,
    uint256 delta
  ) internal returns(uint256) {
    // because we do not set a var for you
    // to collect unattributed tokens
    // it must be done at the end
    amount = amount > delta ? delta : amount;
    unchecked {
      delta = delta - amount;
    }
    emit Tip({
      stakeId: stakeId,
      staker: staker,
      token: token,
      amount: amount
    });
    return delta;
  }
  function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId) internal {
    uint256 i;
    uint256 len = stakeIdTips[stakeId].length;
    uint256 tip;
    uint256 cachedTip;
    do {
      // tips get executed in reverse order so that the contract
      // can clean itself up (gas refund) as it goes along
      tip = stakeIdTips[stakeId][len - 1 - i];
      cachedTip = tip;
      stakeIdTips[stakeId].pop();
      address token = indexToToken[tip >> 224];
      uint256 limit;
      uint256 withdrawableBalance = withdrawableBalanceOf[token][staker];
      if (uint128(tip) == 0) {
        tip = uint96(tip >> 128);
        limit = tip;
      } else {
        limit = uint96(tip >> 128);
        tip = (uint64(tip >> 64) * block.basefee) / uint64(tip);
        tip = _clamp(tip, limit);
        // this is a refund
        unchecked {
          withdrawableBalance += (limit - tip);
        }
      }
      if (tip > 0) {
        emit Tip({
          stakeId: stakeId,
          staker: staker,
          token: token,
          amount: tip
        });
        // this allows the tip to be free floating
        // and picked up by lower level, "unattributed" methods
        unchecked {
          attributed[token] -= tip;
        }
      }
      if (nextStakeId > 0) {
        limit = _clamp({
          amount: limit,
          max: withdrawableBalance
        });
        if (limit > 0) {
          cachedTip = ((cachedTip >> 224) << 224) | (limit << 128) | uint128(cachedTip);
          unchecked {
            withdrawableBalance -= limit;
          }
          uint256 index = stakeIdTips[nextStakeId].length;
          stakeIdTips[nextStakeId].push(cachedTip);
          emit AddTip({
            stakeId: nextStakeId,
            token: token,
            index: index,
            setting: cachedTip
          });
        }
      }
      withdrawableBalanceOf[token][staker] = withdrawableBalance;
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
    return _encodeTipSettings({
      currencyIndex: currencyIndex,
      amount: amount,
      numerator: numerator,
      denominator: denominator
    });
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
  ) external virtual payable returns(uint256, uint256) {
    amount = _depositTokenFrom({
      token: token,
      depositor: msg.sender,
      amount: amount
    });
    address recipient = _verifyTipAmountAllowed({
      stakeId: stakeId,
      amount: amount
    });
    _addToTokenWithdrawable({
      token: token,
      to: recipient,
      amount: amount
    });
    // do now allow for overriding of tip settings, only increase in gas token
    _checkStakeCustodian({
      stakeId: stakeId
    });
    return _addTipToStake({
      token: token,
      account: recipient,
      stakeId: stakeId,
      amount: amount,
      numerator: numerator,
      denominator: denominator
    });
  }
  function removeTipFromStake(
    uint256 stakeId,
    uint256[] calldata indexes
  ) external payable {
    _removeTipFromStake({
      stakeId: stakeId,
      indexes: indexes
    });
  }
  function _removeTipFromStake(
    uint256 stakeId,
    uint256[] memory indexes
  ) internal {
    // if the stake has already ended, we don't care
    // who sends funds back to staking address
    // only one who is incensed to unwind tips is the staker
    // but realistically, anyone can if they wish
    address staker;
    if (stakeIdInfo[stakeId] != 0) {
      _verifyStakeOwnership({
        owner: msg.sender,
        stakeId: stakeId
      });
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
      _addToTokenWithdrawable({
        token: token,
        to: staker,
        amount: uint96(tip >> 128)
      });
      emit RemoveTip({
        stakeId: stakeId,
        token: token,
        index: index,
        setting: tip
      });
      unchecked {
        // this overflows when tips are empty
        --tipsLast;
        ++i;
      }
    } while (i < len);
    if (tipsLast == MAX_256) {
      // remove from settings
      uint256 setting = stakeIdToSettings[stakeId];
      _logSettingsUpdate({
        stakeId: stakeId,
        settings: (setting >> 8 << 8) | (uint8(setting << 2) >> 2)
      });
    }
  }
  function addTipToStake(
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external virtual payable returns(uint256, uint256) {
    _verifyTipAmountAllowed({
      stakeId: stakeId,
      amount: amount
    });
    // deduct from sender account
    _checkStakeCustodian({
      stakeId: stakeId
    });
    return _addTipToStake({
      token: token,
      account: msg.sender,
      stakeId: stakeId,
      amount: amount,
      numerator: numerator,
      denominator: denominator
    });
  }
  function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns(address recipient) {
    (, recipient) = _stakeIdToInfo(stakeId);
    if (amount == 0 && msg.sender != recipient) {
      // cannot allow other people to take staker deposits
      revert NotAllowed();
    }
  }
  function _checkStakeCustodian(uint256 stakeId) internal virtual view {
    if (_stakeCount({
      staker: address(this)
    }) == 0) {
      revert NotAllowed();
    }
    // cannot add a tip to a stake that has already ended
    // if (_stakeById(stakeId).stakeId != stakeId) {
    if (_getStake({
      custodian: address(this),
      index: _stakeIdToIndex({
        stakeId: stakeId
      })
    }).stakeId != stakeId) {
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
    amount = _clamp({
      amount: amount,
      max: withdrawableBalanceOf[token][account]
    });
    if (amount == 0) {
      return (0, 0);
    }
    _tipStakeIdToStaker[stakeId] = _stakeIdToOwner({
      stakeId: stakeId
    });
    // set the tip flag to 1
    // 0b00000001 | 0b10000000 => 0b10000001
    // 0b10000001 | 0b10000000 => 0b10000001
    uint256 currentSettings = stakeIdToSettings[stakeId];
    uint256 updatedSettings = currentSettings | (1 << 7);
    if (updatedSettings != currentSettings) {
      _logSettingsUpdate({
        stakeId: stakeId,
        settings: updatedSettings
      });
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
    uint256 setting = _encodeTipSettings({
      currencyIndex: currencyIndex,
      amount: amount,
      numerator: numerator,
      denominator: denominator
    });
    uint256 index = stakeIdTips[stakeId].length;
    stakeIdTips[stakeId].push(setting);
    emit AddTip({
      stakeId: stakeId,
      token: token,
      index: index,
      setting: setting
    });
    return (index, amount);
  }
  // thank you for your contribution to the protocol
  // the mev bots smile upon thee
  receive() external payable {}
  fallback() external payable {}
}
