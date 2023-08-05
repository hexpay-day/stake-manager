// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./Tipper.sol";
import "./SingletonHedronManager.sol";
import "./StakeEnder.sol";
import "./Magnitude.sol";

contract StakeEnder is Magnitude, Tipper, SingletonHedronManager {
  uint256 public constant MAX_DAYS = 5555;
  /**
   * end a stake for someone other than the sender of the transaction
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(uint256 stakeId) external payable returns(uint256 delta, uint256 count) {
    return _stakeEndByConsent({
      stakeId: stakeId,
      stakeCount: (_currentDay() << 128) | _stakeCount({
        staker: address(this)
      })
    });
  }
  function _verifyStakeMatchesIndex(uint256 index, uint256 stakeId) internal view virtual returns(
    IStakeable.StakeStore memory stake
  ) {
    stake = _getStake({
      custodian: address(this),
      index: index
    });
    // ensure that the stake being ended is the one at the index
    if (stakeId != stake.stakeId) {
      IStakeable.StakeStore memory s;
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
  function _stakeEndByConsent(uint256 stakeId, uint256 stakeCount) internal returns(uint256 delta, uint256) {
    (uint256 idx, address staker) = _stakeIdToInfo({
      stakeId: stakeId
    });
    IStakeable.StakeStore memory stake = _verifyStakeMatchesIndex({
      index: idx,
      stakeId: stakeId
    });
    if (stake.stakeId == 0) {
      return (0, stakeCount);
    }
    uint256 setting = stakeIdToSettings[stakeId];
    if (!_isCapable({
      setting: setting,
      index: 0
    })) {
      return (0, stakeCount);
    }
    if (_isEarlyEnding({
      lockedDay: stake.lockedDay,
      stakedDays: stake.stakedDays,
      targetDay: stakeCount >> 128
    }) && !_isCapable({
      setting: setting,
      index: 1
    })) {
      return (0, stakeCount);
    }
    if (_isCapable({
      setting: setting,
      index: 3
    })) {
      // consent has been confirmed
      uint256 hedronAmount = _mintHedron(idx, stakeId);
      uint256 hedronTipMethod = setting >> 248;
      if (hedronTipMethod > 0) {
        uint256 hedronTip = _computeMagnitude({
          limit: hedronAmount,
          method: hedronTipMethod,
          x: setting << 8 >> 192,
          y: hedronAmount,
          stake: stake
        });
        if (hedronTip > 0) {
          hedronAmount = _checkAndExecTip({
            stakeId: stakeId,
            staker: staker,
            token: hedron,
            amount: hedronTip,
            delta: hedronAmount
          });
        }
      }
      if (hedronAmount > 0) {
        _attributeFunds({
          settings: setting,
          index: 4,
          token: hedron,
          staker: staker,
          amount: hedronAmount
        });
      }
    }
    --stakeCount;
    delta = _stakeEnd({
      stakeIndex: idx,
      stakeId: stakeId,
      stakeCountAfter: uint128(stakeCount)
    });
    // direct funds after end stake
    // only place the stake struct exists is in memory in this method
    {
      uint256 tipMethod = setting << 72 >> 248;
      if (tipMethod > 0) {
        uint256 targetTip = _computeMagnitude({
          limit: delta,
          method: tipMethod,
          x: uint64(setting >> 112),
          y: delta,
          stake: stake
        });
        if (targetTip > 0) {
          delta = _checkAndExecTip({
            stakeId: stakeId,
            staker: staker,
            token: target,
            amount: targetTip,
            delta: delta
          });
        }
      }
    }
    uint256 newStakeMethod = setting << 144 >> 248;
    uint256 nextStakeId;
    if (delta > 0 && newStakeMethod > 0) {
      uint256 newStakeAmount = _computeMagnitude({
        limit: delta,
        method: newStakeMethod,
        x: setting << 152 >> 192,
        y: delta,
        stake: stake
      });
      uint256 newStakeDays = _computeMagnitude({
        limit: MAX_DAYS,
        method: setting << 216 >> 248,
        x: setting << 224 >> 240,
        y: stakeCount >> 128,
        stake: stake
      });
      if (newStakeDays > 0) {
        unchecked {
          delta -= newStakeAmount; // checked for underflow
        }
        nextStakeId = _stakeStartFor({
          owner: staker,
          amount: newStakeAmount,
          newStakedDays: newStakeDays,
          index: uint128(stakeCount)
        });
        ++stakeCount;
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        setting = (_decrementCopyIterations({
          setting: setting
        }) >> 2 << 2) | 1;
        _logSettingsUpdate(nextStakeId, setting);
      }
    }
    if (delta > 0) {
      _attributeFunds({
        settings: setting,
        index: 4,
        token: target,
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
      index: 7
    })) {
      _executeTipList({
        stakeId: stakeId,
        staker: staker,
        nextStakeId: nextStakeId > 0 && _isCapable({
          setting: setting,
          index: 6
        }) ? nextStakeId : 0
      });
    }
    return (delta, stakeCount);
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
    uint256 count = (_currentDay() << 128) | _stakeCount({
      staker: address(this)
    });
    do {
      (, count) = _stakeEndByConsent({
        stakeId: stakeIds[i],
        stakeCount: count
      });
      unchecked {
        ++i;
      }
    } while(i < len);
  }
  /**
   * save a newly started stake's settings
   * @param stakeId the id of the newly minted stake
   * @param settings optional settings passed by stake starter
   */
  function _logSettings(uint256 stakeId, uint256 settings) internal {
    if (settings == 0) {
      _setDefaultSettings({
        stakeId: stakeId
      });
    } else {
      _writePreservedSettingsUpdate({
        stakeId: stakeId,
        settings: settings
      });
    }
  }
}
