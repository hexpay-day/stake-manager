// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Address.sol";
import "./SingletonHedronManager.sol";
import "./Magnitude.sol";
import "./Tipper.sol";

contract SingletonStakeManager is SingletonHedronManager, Tipper, Magnitude {
  using Address for address payable;
  uint256 public constant MAX_DAYS = 5555;
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
  function _stakeById(uint256 stakeId) internal view returns(IStakeable.StakeStore memory) {
    return _stakeByIndex(stakeIdInfo[stakeId] >> 160);
  }
  function _stakeByIndex(uint256 stakeIndex) internal view returns(IStakeable.StakeStore memory) {
    return _getStake(address(this), stakeIndex);
  }
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
   * @return delta the amount of hex at the end of the stake (consumed by _directFunds)
   * @notice hedron minting happens as last step before end stake
   */
  function _stakeEndByConsent(uint256 stakeId) internal returns(uint256 delta) {
    (uint256 idx, address staker) = _stakeIdToInfo(stakeId);
    IStakeable.StakeStore memory stake = _stakeByIndex(idx);
    if (idx == 0 && stakeId != stake.stakeId) {
      return 0;
    }
    uint256 settings = stakeIdToSettings[stakeId];
    uint256 consentAbilities = uint8(settings);
    uint256 today = _currentDay();
    if (((stake.lockedDay + stake.stakedDays) > today) && !_isCapable(consentAbilities, 1)) {
      return 0;
    }
    if (!_isCapable(consentAbilities, 0)) {
      return 0;
    }
    // execute tips after we know that the stake can be ended
    // but before hedron is added to the withdrawable mapping
    if (_isCapable(settings, 6)) {
      _executeTipList(stakeId, staker);
    }
    if (_isCapable(consentAbilities, 3)) {
      // consent has been confirmed
      uint256 hedronAmount = _mintNativeHedron(idx, stakeId);
      uint256 hedronTip = _checkTipAmount(settings >> 184, hedronAmount, stake);
      if (hedronTip > 0) {
        hedronAmount = _checkAndExecTip(
          stakeId,
          staker,
          hedron,
          hedronTip,
          hedronAmount
        );
      }
      _attributeFunds(settings, 5, hedron, staker, hedronAmount);
    }
    delta = _stakeEnd(idx, stakeId);
    _directFunds(
      staker,
      delta,
      stakeId,
      today,
      settings,
      stake
    );
    return delta;
  }
  struct StakeInfo {
    address staker;
    uint96 stakeId;
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
    if (_stakeById(stakeId).stakeId != stakeId) {
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
  /**
   * directs available funds to the next step
   * @param stakeId the stake id to end stake
   * @param delta the magnitude of funds allowed to direct by this method
   * @notice the tip for the end staker is not assigned to anything
   * meaning that it must be collected at the end of the multicall
   * this is done to reduce sloads
   * if you do not collect the unattributed tokens, anyone will be able to
   */
  function _directFunds(
    address staker,
    uint256 delta,
    uint256 stakeId,
    uint256 today,
    uint256 settings,
    IStakeable.StakeStore memory stake
  ) internal {
    uint256 targetTip = _checkTipAmount(settings >> 112, delta, stake);
    if (targetTip > 0) {
      delta = _checkAndExecTip(
        stakeId,
        staker,
        target,
        targetTip,
        delta
      );
    }
    uint256 newStakeMethod = settings << 144 >> 248;
    if (delta > 0 && newStakeMethod > 0) {
      uint256 newStakeAmount = _computeMagnitude(
        newStakeMethod, settings << 152 >> 192, delta,
        stake
      );
      uint256 newStakeDays = _computeMagnitude(
        settings << 216 >> 248, settings << 224 >> 240, today,
        stake
      );
      if (newStakeDays > 0) {
        newStakeAmount = newStakeAmount > delta ? delta : newStakeAmount;
        unchecked {
          delta = delta - newStakeAmount; // checks for underflow
        }
        newStakeDays = newStakeDays > MAX_DAYS ? MAX_DAYS : newStakeDays;
        uint256 nextStakeId = _stakeStartFor(staker, newStakeAmount, newStakeDays);
        // settings will be maintained for the new stake
        // note, because 0 is used, one often needs to use x-1
        // for the number of times you want to copy
        // but because permissions are maintained, it may end up
        // being easier to think about it as x-2
        uint256 copyIterations = uint8(settings >> 8);
        if (copyIterations > 0) {
          if (copyIterations < 255) {
            --copyIterations;
            uint256 s = settings >> 16 << 16;
            s |= (uint256(copyIterations) << 8);
            s |= uint8(settings);
            settings = s;
          }
          // remove consent abilities, put back the last 4 (0-3)
          // which removes the tip flag
          // also, remove the early end flag
          settings = (settings >> 8 << 8) | (settings << 250 >> 254 << 2) | 1;
          _logSettingsUpdate(nextStakeId, settings);
        } else {
          // keep the authorization settings
          // nulls out all other settings
          settings = (uint256(uint8(settings)) >> 2 << 2) | 1;
          _logSettingsUpdate(nextStakeId, settings);
        }
      }
    }
    _attributeFunds(settings, 4, target, staker, delta);
    // skip logging because it will be zero forever
    // use stake end event as means of determining zeroing out
    stakeIdToSettings[stakeId] = 0;
  }
}
