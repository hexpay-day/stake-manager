// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./Tipper.sol";
import "./SingletonHedronManager.sol";
import "./Magnitude.sol";

contract SingletonStakeManager is Magnitude, SingletonHedronManager {
  uint256 public constant MAX_DAYS = 5555;
  /**
   * updates settings under a stake id to the provided settings struct
   * @param stakeId the stake id to update
   * @param settings the settings to update the stake id to
   */
  function updateSettings(uint256 stakeId, Settings calldata settings) external payable {
    _verifyStakeOwnership(msg.sender, stakeId);
    _writePreservedSettingsUpdate(stakeId, _encodeSettings(settings));
  }
  /**
   * end a stake for someone other than the sender of the transaction
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(uint256 stakeId) external payable returns(uint256 delta) {
    return _stakeEndByConsent(stakeId);
  }
  /**
   * end a stake with the consent of the underlying staker's settings
   * @param stakeId the stake id to end
   * @return delta the amount of hex at the end of the stake
   * @notice hedron minting happens as last step before end stake
   */
  function _stakeEndByConsent(uint256 stakeId) internal returns(uint256 delta) {
    (uint256 idx, address staker) = _stakeIdToInfo(stakeId);
    IStakeable.StakeStore memory stake = _getStake(address(this), idx);
    if (idx == 0 && stakeId != stake.stakeId) {
      return 0;
    }
    uint256 setting = stakeIdToSettings[stakeId];
    if (!_isCapable(setting, 0)) {
      return 0;
    }
    uint256 today = _currentDay();
    if (((stake.lockedDay + stake.stakedDays) > today) && !_isCapable(setting, 1)) {
      return 0;
    }
    // execute tips after we know that the stake can be ended
    // but before hedron is added to the withdrawable mapping
    if (_isCapable(setting, 6)) {
      _executeTipList(stakeId, staker);
    }
    if (_isCapable(setting, 3)) {
      // consent has been confirmed
      uint256 hedronAmount = _mintNativeHedron(idx, stakeId);
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
      _attributeFunds(setting, 5, hedron, staker, hedronAmount);
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
        uint256 nextStakeId = _stakeStartFor(staker, newStakeAmount, newStakeDays);
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        uint256 copyIterations = uint8(setting >> 8);
        if (copyIterations > 0) {
          setting = _decrementCopyIterations(copyIterations, setting);
          // remove consent abilities, put back the last 4 (0-3)
          // which removes the tip flag
          // also, remove the early end flag
          setting = (setting >> 8 << 8) | (setting << 250 >> 254 << 2) | 1;
          _logSettingsUpdate(nextStakeId, setting);
        } else {
          // keep the authorization settings
          // nulls out all other settings
          setting = (uint256(uint8(setting)) >> 2 << 2) | 1;
          _logSettingsUpdate(nextStakeId, setting);
        }
      }
    }
    _attributeFunds(setting, 4, target, staker, delta);
    // skip logging because it will be zero forever
    // use stake end event as means of determining zeroing out
    stakeIdToSettings[stakeId] = 0;
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
   * save a newly started stake's settings
   * @param stakeId the id of the newly minted stake
   * @param settings optional settings passed by stake starter
   */
  function _logSettings(uint256 stakeId, uint256 settings) internal {
    if (settings == 0) {
      _setDefaultSettings(stakeId);
    } else {
      _writePreservedSettingsUpdate(stakeId, settings);
    }
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
  // thank you for your contribution to the protocol
  // the mev bots smile upon thee
  receive() external payable {}
  fallback() external payable {}
}
