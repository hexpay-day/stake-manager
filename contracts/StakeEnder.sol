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
  function stakeEndByConsent(uint256 stakeId) external payable returns(uint256 delta) {
    return _stakeEndByConsent(stakeId);
  }
  function _verifyStakeMatchesIndex(uint256 index, uint256 stakeId) internal view virtual returns(
    IStakeable.StakeStore memory stake
  ) {
    stake = _getStake(address(this), index);
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
   */
  function _stakeEndByConsent(uint256 stakeId) internal returns(uint256 delta) {
    (uint256 idx, address staker) = _stakeIdToInfo(stakeId);
    IStakeable.StakeStore memory stake = _verifyStakeMatchesIndex(idx, stakeId);
    if (stake.stakeId == 0) {
      return 0;
    }
    uint256 setting = stakeIdToSettings[stakeId];
    if (!_isCapable(setting, 0)) {
      return 0;
    }
    uint256 today = _currentDay();
    if (_isEarlyEnding(stake.lockedDay, stake.stakedDays, today) && !_isCapable(setting, 1)) {
      return 0;
    }
    if (_isCapable(setting, 3)) {
      // consent has been confirmed
      uint256 hedronAmount = _mintHedron(idx, stakeId);
      uint256 hedronTipMethod = setting >> 248;
      if (hedronTipMethod > 0) {
        uint256 hedronTip = _computeMagnitude(
          hedronAmount, hedronTipMethod, setting << 8 >> 192, hedronAmount,
          stake
        );
        if (hedronTip > 0) {
          hedronAmount = _checkAndExecTip(
            stakeId,
            staker,
            hedron,
            hedronTip,
            hedronAmount
          );
        }
      }
      if (hedronAmount > 0) {
        _attributeFunds(setting, 4, hedron, staker, hedronAmount);
      }
    }
    delta = _stakeEnd(idx, stakeId);
    // direct funds after end stake
    // only place the stake struct exists is in memory in this method
    uint256 tipMethod = setting << 72 >> 248;
    if (tipMethod > 0) {
      uint256 targetTip = _computeMagnitude(
        delta, tipMethod, uint64(setting >> 112), delta,
        stake
      );
      if (targetTip > 0) {
        delta = _checkAndExecTip(
          stakeId,
          staker,
          target,
          targetTip,
          delta
        );
      }
    }
    uint256 newStakeMethod = setting << 144 >> 248;
    uint256 nextStakeId;
    if (delta > 0 && newStakeMethod > 0) {
      uint256 newStakeAmount = _computeMagnitude(
        delta, newStakeMethod, setting << 152 >> 192, delta,
        stake
      );
      uint256 newStakeDays = _computeMagnitude(
        MAX_DAYS, setting << 216 >> 248, setting << 224 >> 240, today,
        stake
      );
      if (newStakeDays > 0) {
        unchecked {
          delta = delta - newStakeAmount; // checks for underflow
        }
        nextStakeId = _stakeStartFor(staker, newStakeAmount, newStakeDays);
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        setting = (_decrementCopyIterations(setting) >> 2 << 2) | 1;
        _logSettingsUpdate(nextStakeId, setting);
      }
    }
    if (delta > 0) {
      _attributeFunds(setting, 4, target, staker, delta);
    }
    // skip logging because it will be zero forever
    // use stake end event as means of determining zeroing out
    stakeIdToSettings[stakeId] = 0;
    // execute tips after we know that the stake can be ended
    // but before hedron is added to the withdrawable mapping
    if (_isCapable(setting, 7)) {
      _executeTipList(stakeId, staker, nextStakeId > 0 && _isCapable(setting, 6) ? nextStakeId : 0);
    }
    return delta;
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
    do {
      _stakeEndByConsent(stakeIds[i]);
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
  /**
   * stake a given number of tokens for a given number of days
   * @param to the address that will own the staker
   * @param amount the number of tokens to stake
   * @param newStakedDays the number of days to stake for
   */
  function stakeStartFromBalanceFor(
    address to,
    uint256 amount,
    uint256 newStakedDays,
    uint256 settings
  ) external payable returns(uint256 stakeId) {
    _depositTokenFrom(target, msg.sender, amount);
    // tokens are essentially unattributed at this point
    stakeId = _stakeStartFor(
      to,
      amount,
      newStakedDays
    );
    _logSettings(stakeId, settings);
  }
  /**
   * start a numbeer of stakes for an address from the withdrawable
   * @param to the account to start a stake for
   * @param amount the number of tokens to start a stake for
   * @param newStakedDays the number of days to stake for
   */
  function stakeStartFromWithdrawableFor(
    address to,
    uint256 amount,
    uint256 newStakedDays,
    uint256 settings
  ) external payable returns(uint256 stakeId) {
    stakeId = _stakeStartFor(
      to,
      _deductWithdrawable(target, msg.sender, amount),
      newStakedDays
    );
    _logSettings(stakeId, settings);
  }
  /**
   * stake a number of tokens for a given number of days, pulling from
   * the unattributed tokens in this contract
   * @param to the owner of the stake
   * @param amount the amount of tokens to stake
   * @param newStakedDays the number of days to stake
   */
  function stakeStartFromUnattributedFor(
    address to,
    uint256 amount,
    uint256 newStakedDays,
    uint256 settings
  ) external payable returns(uint256 stakeId) {
    stakeId = _stakeStartFor(
      to,
      _clamp(amount, _getUnattributed(target)),
      newStakedDays
    );
    _logSettings(stakeId, settings);
  }
}
