// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { SingletonHedronManager } from "./SingletonHedronManager.sol";
import { Magnitude } from "./Magnitude.sol";

contract StakeEnder is Magnitude, SingletonHedronManager {
  uint8 public constant INDEX_RIGHT_TODAY = 128;

  /**
   * end a stake for someone other than the sender of the transaction
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(uint256 stakeId) external payable returns(uint256 delta, uint256 count) {
    return _stakeEndByConsentWithTipTo({
      stakeId: stakeId,
      tipTo: address(0)
    });
  }
  function stakeEndByConsentWithTipTo(
    uint256 stakeId, address tipTo
  ) external payable returns(uint256 delta, uint256 count) {
    return _stakeEndByConsentWithTipTo({
      stakeId: stakeId,
      tipTo: tipTo
    });
  }
  function _stakeEndByConsentWithTipTo(
    uint256 stakeId, address tipTo
  ) internal returns(uint256 delta, uint256 count) {
    return _stakeEndByConsent({
      stakeId: stakeId,
      tipTo: tipTo,
      count: (_currentDay() << INDEX_RIGHT_TODAY) | _stakeCount({
        staker: address(this)
      })
    });
  }
  function _verifyStakeMatchesIndex(uint256 index, uint256 stakeId) internal view virtual returns(
    UnderlyingStakeable.StakeStore memory stake
  ) {
    stake = _getStake({
      custodian: address(this),
      index: index
    });
    // ensure that the stake being ended is the one at the index
    if (stakeId != stake.stakeId) {
      UnderlyingStakeable.StakeStore memory s;
      return s;
    }
  }
  /**
   * end a stake with the consent of the underlying staker's settings
   * @param stakeId the stake id to end
   * @return delta the amount of hex at the end of the stake
   * @notice hedron minting happens as last step before end stake
   * @dev the stake count is today | stake count because
   * if there were 2 variables, the contract ended up too large
   */
  function _stakeEndByConsent(
    uint256 stakeId, address tipTo, uint256 count
  ) internal returns(uint256 delta, uint256) {
    (uint256 idx, address staker) = _stakeIdToInfo({
      stakeId: stakeId
    });
    UnderlyingStakeable.StakeStore memory stake = _verifyStakeMatchesIndex({
      index: idx,
      stakeId: stakeId
    });
    if (stake.stakeId == ZERO) {
      return (ZERO, count);
    }
    uint256 setting = stakeIdToSettings[stakeId];
    if (!_isOneAtIndex({
      setting: setting,
      index: INDEX_RIGHT_CAN_STAKE_END
    })) {
      return (ZERO, count);
    }
    if (_isEarlyEnding({
      lockedDay: stake.lockedDay,
      stakedDays: stake.stakedDays,
      targetDay: count >> INDEX_RIGHT_TODAY
    }) && !_isOneAtIndex({
      setting: setting,
      index: INDEX_RIGHT_CAN_EARLY_STAKE_END
    })) {
      return (ZERO, count);
    }
    if (_isOneAtIndex({
      setting: setting,
      index: INDEX_RIGHT_CAN_MINT_HEDRON_AT_END
    })) {
      // consent has been confirmed
      uint256 hedronAmount = _mintHedron(idx, stakeId);
      if (uint8(setting >> INDEX_RIGHT_HEDRON_TIP) > ZERO) {
        uint256 hedronTip = _computeMagnitude({
          limit: hedronAmount,
          linear: uint72(setting >> INDEX_RIGHT_HEDRON_TIP),
          v2: hedronAmount,
          v1: ZERO
        });
        if (hedronTip > ZERO) {
          unchecked {
            hedronAmount = hedronAmount - hedronTip;
          }
          if (tipTo != address(0)) {
            _addToTokenWithdrawable({
              token: HEDRON,
              to: tipTo,
              amount: hedronTip
            });
          }
          emit Tip({
            stakeId: stakeId,
            token: HEDRON,
            to: tipTo,
            amount: hedronTip
          });
        }
      }
      if (hedronAmount > ZERO) {
        _attributeFunds({
          setting: setting,
          token: HEDRON,
          staker: staker,
          amount: hedronAmount
        });
      }
    }
    --count;
    delta = _stakeEnd({
      stakeIndex: idx,
      stakeId: stakeId,
      stakeCountAfter: uint128(count)
    });
    // direct funds after end stake
    // only place the stake struct exists is in memory in this method
    if (uint8(setting >> INDEX_RIGHT_TARGET_TIP) > ZERO) {
      uint256 targetTip = _computeMagnitude({
        limit: delta,
        linear: uint72(setting >> INDEX_RIGHT_TARGET_TIP),
        v2: delta,
        v1: stake.stakedHearts
      });
      if (targetTip > ZERO) {
        unchecked {
          delta = delta - targetTip;
        }
        if (tipTo != address(0)) {
          _addToTokenWithdrawable({
            token: TARGET,
            to: tipTo,
            amount: targetTip
          });
        }
        emit Tip({
          stakeId: stakeId,
          token: TARGET,
          to: tipTo,
          amount: targetTip
        });
      }
    }
    uint256 nextStakeId;
    if (delta > ZERO && uint8(setting >> INDEX_RIGHT_NEW_STAKE) > ZERO) {
      uint256 newStakeAmount = _computeMagnitude({
        limit: delta,
        linear: uint72(setting >> INDEX_RIGHT_NEW_STAKE),
        v2: delta,
        v1: stake.stakedHearts
      });
      if (newStakeAmount > ZERO) {
        uint256 newStakeDaysMethod = uint8(setting >> INDEX_RIGHT_NEW_STAKE_DAYS_METHOD);
        if (newStakeDaysMethod > ZERO) {
          uint256 newStakeDays = _computeDayMagnitude({
            limit: MAX_DAYS,
            method: newStakeDaysMethod,
            x: uint16(setting >> INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE),
            today: count >> INDEX_RIGHT_TODAY,
            lockedDay: stake.lockedDay,
            stakedDays: stake.stakedDays
          });
          unchecked {
            delta -= newStakeAmount; // checked for underflow
          }
          nextStakeId = _stakeStartFor({
            owner: staker,
            amount: newStakeAmount,
            newStakedDays: newStakeDays,
            index: uint128(count)
          });
          ++count;
        }
      }
    }
    if (delta > ZERO) {
      _attributeFunds({
        setting: setting,
        token: TARGET,
        staker: staker,
        amount: delta
      });
    }
    if (_isOneAtIndex({
      setting: setting,
      index: INDEX_RIGHT_HAS_EXTERNAL_TIPS
    })) {
      uint256 nextStakeTipsLength = _executeTipList({
        stakeId: stakeId,
        staker: staker,
        tipTo: tipTo,
        nextStakeId: _isOneAtIndex({
          setting: setting,
          index: INDEX_RIGHT_COPY_EXTERNAL_TIPS
        }) ? nextStakeId : ZERO
      });
      if (nextStakeTipsLength > ZERO) {
        // add setting to flag tips as existing in new settings
        setting = setting | (ONE << INDEX_RIGHT_HAS_EXTERNAL_TIPS);
      }
    }
    if (nextStakeId > ZERO) {
      // settings will be maintained for the new stake
      // note, because 0 is used, one often needs to use x-1
      // for the number of times you want to copy
      // but because permissions are maintained, it may end up
      // being easier to think about it as x-2
      setting = (_decrementCopyIterations({
        setting: setting
      }) >> INDEX_RIGHT_CAN_MINT_HEDRON << INDEX_RIGHT_CAN_MINT_HEDRON) | ONE;
      _logSettingsUpdate({
        stakeId: nextStakeId,
        settings: setting
      });
    }
    return (delta, count);
  }
  function stakeEndByConsentForMany(uint256[] calldata stakeIds) external payable {
    _stakeEndByConsentForManyWithTipTo({
      stakeIds: stakeIds,
      tipTo: address(0)
    });
  }
  function stakeEndByConsentForManyWithTipTo(uint256[] calldata stakeIds, address tipTo) external payable {
    _stakeEndByConsentForManyWithTipTo({
      stakeIds: stakeIds,
      tipTo: tipTo
    });
  }
  /**
   * end many stakes at the same time
   * provides an optimized path for all stake ends
   * and assumes that detectable failures should be skipped
   * @param stakeIds stake ids to end
   * @notice this method should, generally, only be called when multiple enders
   * are attempting to end stake the same stakes
   */
  function _stakeEndByConsentForManyWithTipTo(uint256[] calldata stakeIds, address tipTo) internal {
    uint256 i;
    uint256 len = stakeIds.length;
    uint256 count = (_currentDay() << INDEX_RIGHT_TODAY) | _stakeCount({
      staker: address(this)
    });
    do {
      (, count) = _stakeEndByConsent({
        stakeId: stakeIds[i],
        tipTo: tipTo,
        count: count
      });
      unchecked {
        ++i;
      }
    } while(i < len);
  }
  function _stakeEnd(
    uint256 stakeIndex, uint256 stakeId, uint256 stakeCountAfter
  ) internal virtual override returns(uint256) {
    if (stakeIdToSettings[stakeId] > ZERO) {
      stakeIdToSettings[stakeId] = ZERO;
    }
    return super._stakeEnd(stakeIndex, stakeId, stakeCountAfter);
  }
}
