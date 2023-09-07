// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { Bank } from "./Bank.sol";
import { CurrencyList } from "./CurrencyList.sol";
import { EncodableSettings } from "./EncodableSettings.sol";

abstract contract Tipper is Bank, UnderlyingStakeable, CurrencyList, EncodableSettings {
  // 2^56 is a lot harder to grief than 2^32
  uint256 internal constant INDEX_EXTERNAL_TIP_CURRENCY = 200;
  uint256 internal constant INDEX_EXTERNAL_TIP_CURRENCY_ONLY = INDEX_EXTERNAL_TIP_CURRENCY + ONE;
  uint256 internal constant INDEX_EXTERNAL_TIP_LIMIT = SEVENTY_TWO; // 128 bits long
  uint256 internal constant INDEX_EXTERNAL_TIP_METHOD = 64;
  constructor()
    Bank()
    UnderlyingStakeable()
    CurrencyList()
    EncodableSettings()
  {
    _addCurrencyToList(address(0));
    // this line allows hex to be tipped by factor of basefee
    _addCurrencyToList(TARGET);
    _addCurrencyToList(HEDRON);
  }
  /**
   * @dev this mapping is needed for the case where a tip is added to a stake
   * but the staker ends the stake on a lower level which never checks for tips
   * this mapping slightly increases the cost of initializing tips as well as transferring them
   * but that is ok, because we generally do not want people to be trading stakes at this level
   * of anyone wants to be swapping ownership over stakes then they can create
   * an erc721 and trade at a higher level
   * also end stakers get a larger refund due to more information being zero'd out
   * it is set to internal because, generally, the stake id should be going
   * to the lower level `stakeIdInfo` mapping and individuals who do not wish to tip
   * should not be charged 2k gas for checking if this mapping exists
   */
  mapping(uint256 => address) internal tipStakeIdToStaker;
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
  function _executeTipList(uint256 stakeId, address staker, uint256 nextStakeId) internal {
    uint256 i;
    uint256 len = stakeIdTips[stakeId].length;
    uint256 tip;
    uint256 cachedTip;
    // this line disallows reentrancy to mutate the tips list
    tipStakeIdToStaker[stakeId] = address(0);
    do {
      // tips get executed in reverse order so that the contract
      // can clean itself up (gas refund) as it goes along
      tip = stakeIdTips[stakeId][len - ONE - i];
      cachedTip = tip;
      stakeIdTips[stakeId].pop();
      uint256 idx = tip << ONE >> INDEX_EXTERNAL_TIP_CURRENCY_ONLY;
      address token = indexToToken[idx];
      bool reusable = (tip >> MAX_UINT8) == ONE;
      uint256 withdrawableBalance = withdrawableBalanceOf[token][staker];
      uint256 cachedWithdrawableBalance = withdrawableBalance;
      uint256 limit = uint128(tip >> INDEX_EXTERNAL_TIP_LIMIT);
      if (uint72(tip) == ZERO) {
        // existance of a tip number allows us to use ZERO as simplest pathway
        tip = limit;
      } else {
        uint256 method = uint8(tip >> INDEX_EXTERNAL_TIP_METHOD);
        if (method > ZERO) { // requirement by computeMagnitude
          tip = _computeMagnitude({
            limit: limit,
            method: uint8(tip >> INDEX_EXTERNAL_TIP_METHOD),
            x: uint64(tip), // magnitude
            y2: block.basefee,
            y1: ZERO
          });
        }
        // this is a refund
        unchecked {
          withdrawableBalance += (limit - tip);
        }
      }
      if (tip > ZERO) {
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
      if (reusable && nextStakeId > ZERO) {
        limit = _clamp({
          amount: limit,
          max: withdrawableBalance
        });
        if (limit > ZERO) {
          cachedTip = _encodeTipSettings(reusable, idx, limit, cachedTip);
          unchecked {
            withdrawableBalance -= limit;
          }
          // we no longer need currency idx
          // so this line takes it over / reuses it
          idx = stakeIdTips[nextStakeId].length;
          stakeIdTips[nextStakeId].push(cachedTip);
          if (idx == ZERO) {
            _transferTipLock(stakeId, false);
          }
          emit AddTip({
            stakeId: nextStakeId,
            token: token,
            index: idx,
            setting: cachedTip
          });
        }
      }
      if (withdrawableBalance != cachedWithdrawableBalance) {
        withdrawableBalanceOf[token][staker] = withdrawableBalance;
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
   * @param fullEncodedLinear the method+xyb function to use
   */
  function encodeTipSettings(
    bool reusable,
    uint256 currencyIndex,
    uint256 amount,
    uint256 fullEncodedLinear
  ) external pure returns(uint256) {
    return _encodeTipSettings({
      reusable: reusable,
      currencyIndex: currencyIndex,
      amount: amount,
      fullEncodedLinear: fullEncodedLinear
    });
  }
  function encodedLinearWithMethod(
    uint256 method,
    uint256 xFactor,
    int256 x,
    uint256 yFactor,
    uint256 y,
    uint256 bFactor,
    int256 b
  ) external pure returns(uint256) {
    (uint256 encodedMethod, uint256 magnitude) = _encodeLinear(
      method,
      xFactor, x,
      yFactor, y,
      bFactor, b
    );
    return (encodedMethod << INDEX_EXTERNAL_TIP_METHOD) | magnitude;
  }
  function _encodeTipSettings(
    bool reusable,
    uint256 currencyIndex,
    uint256 amount,
    uint256 fullEncodedLinear
  ) internal pure returns(uint256) {
    if (uint8(fullEncodedLinear >> INDEX_EXTERNAL_TIP_METHOD) == ZERO && fullEncodedLinear != ZERO) {
      revert NotAllowed();
    }
    return uint256(reusable ? ONE : ZERO) << MAX_UINT8
      | (uint256(currencyIndex) << INDEX_EXTERNAL_TIP_CURRENCY)
      | (uint256(uint128(amount)) << INDEX_EXTERNAL_TIP_LIMIT)
      | uint256(uint72(fullEncodedLinear));
  }
  function depositAndAddTipToStake(
    bool reusable,
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 fullEncodedLinear
  ) external virtual payable returns(uint256, uint256) {
    uint256 depositedAmount = _depositTokenFrom({
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
      amount: depositedAmount
    });
    // do now allow for overriding of tip settings, only increase in gas token
    _checkStakeCustodian({
      stakeId: stakeId
    });
    return _addTipToStake({
      reusable: reusable,
      token: token,
      account: recipient,
      stakeId: stakeId,
      amount: amount,
      fullEncodedLinear: fullEncodedLinear
    });
  }
  function removeAllTips(uint256 stakeId) external {
    _verifyStakeOwnership({
      owner: msg.sender,
      stakeId: stakeId
    });
    _removeAllTips({
      stakeId: stakeId,
      settings: stakeIdToSettings[stakeId]
    });
  }
  function _removeAllTips(uint256 stakeId, uint256 settings) internal {
    uint256 tipCount = _stakeIdTipSize({
      stakeId: stakeId
    });
    if (tipCount > ZERO) {
      uint256 i;
      uint256[] memory indexes = new uint256[](tipCount);
      unchecked {
        --tipCount;
      }
      do {
        unchecked {
          indexes[i] = tipCount - i;
          ++i;
        }
      } while (i <= tipCount);
      _removeTipsFromStake({
        stakeId: stakeId,
        settings: settings,
        indexes: indexes
      });
    }
  }
  function removeTipsFromStake(
    uint256 stakeId,
    uint256[] calldata indexes
  ) external payable {
    _removeTipsFromStake({
      stakeId: stakeId,
      settings: stakeIdToSettings[stakeId],
      indexes: indexes
    });
  }
  function _removeTipsFromStake(
    uint256 stakeId,
    uint256 settings,
    uint256[] memory indexes
  ) internal {
    // if the stake has already ended, we don't care
    // who sends funds back to staking address
    // only one who is incensed to unwind tips is the staker
    // but realistically, anyone can if they wish
    address staker;
    if (stakeIdInfo[stakeId] != ZERO) {
      _verifyStakeOwnership({
        owner: msg.sender,
        stakeId: stakeId
      });
      staker = msg.sender;
    } else {
      staker = tipStakeIdToStaker[stakeId];
    }
    // disallows reentrancy
    if (staker == address(0)) {
      return;
    }
    uint256[] storage tips = stakeIdTips[stakeId];
    // this will fail if no tips exist
    uint256 tipsLast = tips.length - 1;
    uint256 len = indexes.length;
    uint256 i;
    do {
      uint256 index = indexes[i];
      uint256 tip = tips[index];
      if (tipsLast > index) {
        // if we are not currently targeting the last in the tips array
        // then we have to move tips around to prevent gaps in list
        tips[index] = tips[tipsLast];
      }
      tips.pop();
      // now do something with the tip
      address token = address(indexToToken[tip >> INDEX_EXTERNAL_TIP_CURRENCY]);
      _attributeFunds({
        token: token,
        index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER,
        setting: settings,
        staker: staker,
        amount: uint128(tip >> INDEX_EXTERNAL_TIP_LIMIT)
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
        settings: (
          (setting >> INDEX_COPY_ITERATIONS << INDEX_COPY_ITERATIONS)
          // only remove information about the existance of a list
          // not whether or not to copy said list in subsequent stakes
          // should it exist again
          // in other words, copying remains in the hands of the staker
          | (uint8(setting << TWO) >> TWO)
        )
      });
    }
  }
  function addTipToStake(
    bool reusable,
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 fullEncodedLinear
  ) external virtual payable returns(uint256, uint256) {
    _verifyTipAmountAllowed({
      stakeId: stakeId,
      amount: amount
    });
    _checkStakeCustodian({
      stakeId: stakeId
    });
    // deduct from sender account
    return _addTipToStake({
      reusable: reusable,
      token: token,
      account: msg.sender,
      stakeId: stakeId,
      amount: amount,
      fullEncodedLinear: fullEncodedLinear
    });
  }
  function _verifyTipAmountAllowed(uint256 stakeId, uint256 amount) internal view returns(address recipient) {
    (, recipient) = _stakeIdToInfo(stakeId);
    if (amount == ZERO && msg.sender != recipient) {
      // cannot allow other people to take staker deposits
      revert NotAllowed();
    }
  }
  function _checkStakeCustodian(uint256 stakeId) internal virtual view {
    if (_stakeCount({
      staker: address(this)
    }) == ZERO) {
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
  function _transferTipLock(uint256 stakeId, bool force) internal {
    if (tipStakeIdToStaker[stakeId] == address(0) || force) {
      address owner = _stakeIdToOwner({
        stakeId: stakeId
      });
      if (owner != address(0)) {
        tipStakeIdToStaker[stakeId] = owner;
      }
    }
  }
  function _addTipToStake(
    bool reusable,
    address token,
    address account,
    uint256 stakeId,
    uint256 amount,
    uint256 fullEncodedLinear
  ) internal returns(uint256 index, uint256 tipAmount) {
    tipAmount = _clamp({
      amount: amount,
      max: withdrawableBalanceOf[token][account]
    });
    if (tipAmount == ZERO) {
      return (ZERO, ZERO);
    }
    _transferTipLock(stakeId, false);
    // set the tip flag to 1
    // 0b00000001 | 0b10000000 => 0b10000001
    // 0b10000001 | 0b10000000 => 0b10000001
    uint256 currentSettings = stakeIdToSettings[stakeId];
    uint256 updatedSettings = currentSettings | (ONE << INDEX_HAS_EXTERNAL_TIPS);
    if (updatedSettings != currentSettings) {
      _logSettingsUpdate({
        stakeId: stakeId,
        settings: updatedSettings
      });
    }
    unchecked {
      withdrawableBalanceOf[token][account] -= tipAmount;
      // settings must be provided with each addition
      // this result provides 15*basefee/2, up to 10m hedron as a contrived example
      // 0x0000000200000000002386f26fc10000000000000000000f0000000000000002
    }
    uint256 currencyIndex = currencyToIndex[token];
    if (currencyIndex == ZERO && token != address(0)) {
      revert NotAllowed();
    }
    uint256 setting = _encodeTipSettings({
      reusable: reusable,
      currencyIndex: currencyIndex,
      amount: tipAmount,
      fullEncodedLinear: fullEncodedLinear
    });
    index = stakeIdTips[stakeId].length;
    stakeIdTips[stakeId].push(setting);
    emit AddTip({
      stakeId: stakeId,
      token: token,
      index: index,
      setting: setting
    });
    return (index, tipAmount);
  }
  // thank you for your contribution to the protocol
  // the mev bots smile upon thee
  receive() external payable {}
}
