// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { SingletonMintManager } from "./SingletonMintManager.sol";
import { Magnitude } from "./Magnitude.sol";

contract StakeEnder is Magnitude, SingletonMintManager {
  uint256 public constant INDEX_RIGHT_TODAY = 128;
  /**
   * end a stake, given its settings, and tip to a given address
   * @param stakeId the stake id being targeted for ending
   * @param tipTo where to send tokens from tips
   * @return count the current day and number of stakes remaining concatted with |
   */
  function stakeEndByConsentWithTipTo(
    uint256 stakeId, address tipTo
  ) external payable returns(bool) {
    unchecked {
      return (_stakeEndByConsent({
        stakeId: stakeId,
        tipTo: tipTo,
        count: (_currentDay() << INDEX_RIGHT_TODAY) | _getStakeCount({
          staker: address(this)
        })
      }) >> SLOTS) == ONE;
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
  ) internal returns(uint256) {
    unchecked {
      uint256 delta;
      address staker;
      uint256 idx;
      UnderlyingStakeable.StakeStore memory stake;
      {
        bool valid;
        (valid, staker, idx, stake) = _getStakeInfo(stakeId);
        if (!valid) {
          return count;
        }
      }
      uint256 settings = stakeIdToSettings[stakeId];
      if (!_isOneAtIndex({
        settings: settings,
        index: INDEX_RIGHT_CAN_STAKE_END
      })) {
        return count;
      }
      if (_isEarlyEnding({
        lockedDay: stake.lockedDay,
        stakedDays: stake.stakedDays,
        targetDay: count >> INDEX_RIGHT_TODAY
      })) {
        if (!_isOneAtIndex({
          settings: settings,
          index: INDEX_RIGHT_CAN_EARLY_STAKE_END
        })) return count;
      }
      if (_isOneAtIndex({
        settings: settings,
        index: INDEX_RIGHT_CAN_MINT_HEDRON_AT_END
      })) {
        // consent has been confirmed
        uint256 hedronAmount = _mintHedron(idx, stakeId);
        if (uint8(settings >> INDEX_RIGHT_HEDRON_TIP) > ZERO) {
          uint256 hedronTip = _computeMagnitude({
            limit: hedronAmount,
            linear: uint72(settings >> INDEX_RIGHT_HEDRON_TIP),
            v2: hedronAmount,
            v1: ZERO
          });
          if (hedronTip > ZERO) {
            hedronAmount = hedronAmount - hedronTip;
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
            settings: settings,
            token: HEDRON,
            staker: staker,
            amount: hedronAmount
          });
        }
      }
      if (_isOneAtIndex({
        settings: settings,
        index: INDEX_RIGHT_MINT_COMMUNIS_AT_END
      })) {
        _communisStakeEndBonus({
          settings: settings,
          today: count >> INDEX_RIGHT_TODAY,
          index: idx,
          staker: staker,
          referrer: tipTo,
          stake: stake
        });
      }
      // if this were to ever overflow then it will fail
      // in the subsequent stake end method since
      // hex can only hold 2^40-1 stakes
      --count;
      delta = _stakeEnd({
        stakeIndex: idx,
        stakeId: stakeId,
        stakeCountAfter: uint128(count)
      });
      uint256 nextStakeId;
      if (delta > ZERO) {
        // direct funds after end stake
        // only place the stake struct exists is in memory in this method
        if (uint8(settings >> INDEX_RIGHT_TARGET_TIP) > ZERO) {
          uint256 targetTip = _computeMagnitude({
            limit: delta,
            linear: uint72(settings >> INDEX_RIGHT_TARGET_TIP),
            v2: delta,
            v1: stake.stakedHearts
          });
          if (targetTip > ZERO) {
            delta -= targetTip;
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
        if (uint8(settings >> INDEX_RIGHT_NEW_STAKE) > ZERO) {
          uint256 newStakeAmount = _computeMagnitude({
            limit: delta,
            linear: uint72(settings >> INDEX_RIGHT_NEW_STAKE),
            v2: delta,
            v1: stake.stakedHearts
          });
          if (newStakeAmount > ZERO) {
            // this does not account for minimum newStakeAmount to have at least 1 share
            // it is too expensive to check in the middle of this tight loop without
            // crazy high costs - for the next 15 years, it should be done off chain
            // stakes small enough to be anywhere near this
            // threshold should simply be ignored
            uint256 newStakeDaysMethod = uint8(settings >> INDEX_RIGHT_NEW_STAKE_DAYS_METHOD);
            if (newStakeDaysMethod > ZERO) {
              uint256 newStakeDays;
              (newStakeDaysMethod, newStakeDays) = _computeDayMagnitude({
                limit: MAX_DAYS,
                method: newStakeDaysMethod,
                x: uint16(settings >> INDEX_RIGHT_NEW_STAKE_DAYS_MAGNITUDE),
                today: count >> INDEX_RIGHT_TODAY,
                lockedDay: stake.lockedDay,
                stakedDays: stake.stakedDays
              });
              settings = (
                (settings >> INDEX_RIGHT_NEW_STAKE) << INDEX_RIGHT_NEW_STAKE
                | (newStakeDaysMethod << THIRTY_TWO) // only 0-4
                | uint32(settings)
              );
              delta -= newStakeAmount; // already checked for underflow
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
          // attribute leftover funds to staker
          _attributeFunds({
            settings: settings,
            token: TARGET,
            staker: staker,
            amount: delta
          });
        }
      }
      if (_isOneAtIndex({
        settings: settings,
        index: INDEX_RIGHT_HAS_EXTERNAL_TIPS
      })) {
        uint256 nextStakeTipsLength = _executeTipList({
          stakeId: stakeId,
          staker: staker,
          tipTo: tipTo,
          nextStakeId: _isOneAtIndex({
            settings: settings,
            index: INDEX_RIGHT_COPY_EXTERNAL_TIPS
          }) ? nextStakeId : ZERO
        });
        if (nextStakeTipsLength > ZERO) {
          // add settings to flag tips as existing in new settings
          settings = settings | (uint256(ONE) << INDEX_RIGHT_HAS_EXTERNAL_TIPS);
        }
      }
      if (nextStakeId > ZERO) {
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        settings = (_decrementCopyIterations({
          settings: settings
        }) >> INDEX_RIGHT_CAN_MINT_HEDRON << INDEX_RIGHT_CAN_MINT_HEDRON) | ONE;
        _logSettingsUpdate({
          stakeId: nextStakeId,
          settings: settings
        });
      }
      return count | (uint256(ONE) << SLOTS);
    }
  }
  /**
   * end many stakes at the same time
   * provides an optimized path for all stake ends
   * and assumes that detectable failures should be skipped
   * @param stakeIds stake ids to end
   * @notice this method should, generally, only be called when multiple enders
   * are attempting to end stake the same stakes
   * @return ended a counter
   */
  function stakeEndByConsentForManyWithTipTo(
    uint256[] calldata stakeIds,
    address tipTo
  ) external payable returns(uint256, uint256[] memory) {
    unchecked {
      uint256 i;
      uint256 ended;
      uint256 len = stakeIds.length;
      uint256[] memory mask = new uint256[](len);
      uint256 count = (_currentDay() << INDEX_RIGHT_TODAY) | _getStakeCount({
        staker: address(this)
      });
      do {
        count = _stakeEndByConsent({
          stakeId: stakeIds[i],
          tipTo: tipTo,
          count: count
        });
        if (count >> SLOTS == ONE) {
          // stake did end
          mask[i] = stakeIds[i];
          ++ended;
        }
        count = uint248(count); // reset memo
        ++i;
      } while(i < len);
      return (ended, mask);
    }
  }
}
