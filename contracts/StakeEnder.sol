// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import "./SingletonHedronManager.sol";
import "./Magnitude.sol";

contract StakeEnder is Magnitude, SingletonHedronManager {
  uint8 public constant INDEX_TODAY = 128;

  /**
   * end a stake for someone other than the sender of the transaction
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(uint256 stakeId) external payable returns(uint256 delta, uint256 count) {
    return _stakeEndByConsent({
      stakeId: stakeId,
      _count: (_currentDay() << INDEX_TODAY) | _stakeCount({
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
  function _stakeEndByConsent(uint256 stakeId, uint256 _count) internal returns(uint256 delta, uint256 count) {
    count = _count;
    (uint256 idx, address staker) = _stakeIdToInfo({
      stakeId: stakeId
    });
    UnderlyingStakeable.StakeStore memory stake = _verifyStakeMatchesIndex({
      index: idx,
      stakeId: stakeId
    });
    if (stake.stakeId == 0) {
      return (0, count);
    }
    uint256 setting = stakeIdToSettings[stakeId];
    if (!_isCapable({
      setting: setting,
      index: 0
    })) {
      return (0, count);
    }
    if (_isEarlyEnding({
      lockedDay: stake.lockedDay,
      stakedDays: stake.stakedDays,
      targetDay: count >> INDEX_TODAY
    }) && !_isCapable({
      setting: setting,
      index: INDEX_CAN_EARLY_STAKE_END
    })) {
      return (0, count);
    }
    if (_isCapable({
      setting: setting,
      index: INDEX_CAN_MINT_HEDRON_AT_END
    })) {
      // consent has been confirmed
      uint256 hedronAmount = _mintHedron(idx, stakeId);
      uint256 hedronTipMethod = setting >> UNUSED_SPACE_RIGHT_UINT8;
      if (hedronTipMethod > 0) {
        uint256 hedronTip = _computeMagnitude({
          limit: hedronAmount,
          method: hedronTipMethod,
          x: setting << UNUSED_SPACE_HEDRON_TIP_MAGNITUDE >> UNUSED_SPACE_RIGHT_UINT64,
          y: hedronAmount,
          stake: stake
        });
        if (hedronTip > 0) {
          hedronAmount = _checkAndExecTip({
            stakeId: stakeId,
            staker: staker,
            token: HEDRON,
            amount: hedronTip,
            delta: hedronAmount
          });
        }
      }
      if (hedronAmount > 0) {
        _attributeFunds({
          setting: setting,
          index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER,
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
    {
      uint256 tipMethod = setting << UNUSED_SPACE_TIP_METHOD >> UNUSED_SPACE_RIGHT_UINT8;
      if (tipMethod > 0) {
        uint256 targetTip = _computeMagnitude({
          limit: delta,
          method: tipMethod,
          x: uint64(setting >> INDEX_TIP_MAGNITUDE),
          y: delta,
          stake: stake
        });
        if (targetTip > 0) {
          delta = _checkAndExecTip({
            stakeId: stakeId,
            staker: staker,
            token: TARGET,
            amount: targetTip,
            delta: delta
          });
        }
      }
    }
    uint256 newStakeMethod = setting << UNUSED_SPACE_NEW_STAKE_METHOD >> UNUSED_SPACE_RIGHT_UINT8;
    uint256 nextStakeId;
    if (delta > 0 && newStakeMethod > 0) {
      uint256 newStakeAmount = _computeMagnitude({
        limit: delta,
        method: newStakeMethod,
        x: setting << 152 >> 192,
        y: delta,
        stake: stake
      });
      uint256 newStakeDays = (
        setting << UNUSED_SPACE_NEW_STAKE_DAYS_METHOD >> UNUSED_SPACE_RIGHT_UINT8) > 0
          ? _computeDayMagnitude({
            limit: MAX_DAYS,
            method: setting << UNUSED_SPACE_NEW_STAKE_DAYS_METHOD >> UNUSED_SPACE_RIGHT_UINT8,
            x: setting << UNUSED_SPACE_NEW_STAKE_DAYS_MAGNITUDE >> UNUSED_SPACE_RIGHT_UINT16,
            y: count >> INDEX_TODAY,
            stake: stake
          })
          : 0;
      if (newStakeDays > 0) {
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
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        setting = (_decrementCopyIterations({
          setting: setting
        }) >> INDEX_CAN_MINT_HEDRON << INDEX_CAN_MINT_HEDRON) | 1;
        _logSettingsUpdate({
          stakeId: nextStakeId,
          settings: setting
        });
      }
    }
    if (delta > 0) {
      _attributeFunds({
        setting: setting,
        index: INDEX_SHOULD_SEND_TOKENS_TO_STAKER,
        token: TARGET,
        staker: staker,
        amount: delta
      });
    }
    // skip logging because it will be zero forever
    // use stake end event as means of determining zeroing out
    stakeIdToSettings[stakeId] = 0;
    // execute tips after we know that the stake can be ended
    // but before hedron is added to the withdrawable mapping
    if (_isCapable({
      setting: setting,
      index: INDEX_HAS_EXTERNAL_TIPS
    })) {
      _executeTipList({
        stakeId: stakeId,
        staker: staker,
        nextStakeId: nextStakeId > 0 && _isCapable({
          setting: setting,
          index: INDEX_COPY_EXTERNAL_TIPS
        }) ? nextStakeId : 0
      });
    }
    return (delta, count);
  }
  /**
   * end many stakes at the same time
   * provides an optimized path for all stake ends
   * and assumes that detectable failures should be skipped
   * @param stakeIds stake ids to end
   * @notice this method should, generally, only be called when multiple enders
   * are attempting to end stake the same stakes
   */
  function stakeEndByConsentForMany(uint256[] calldata stakeIds) external payable {
    uint256 i;
    uint256 len = stakeIds.length;
    uint256 count = (_currentDay() << INDEX_TODAY) | _stakeCount({
      staker: address(this)
    });
    do {
      (, count) = _stakeEndByConsent({
        stakeId: stakeIds[i],
        _count: count
      });
      unchecked {
        ++i;
      }
    } while(i < len);
  }
}
