// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./SingletonHedronManager.sol";
import "./IHedron.sol";

contract SingletonStakeManager is SingletonHedronManager {
  /**
   * @notice this error is thrown when the stake in question
   * is not owned by the expected address
   */
  error StakeNotOwned(address provided, address expected);
  /**
   * @notice this var is re-defined here to keep the computeMagnitude method pure
   * at the cost of one extra byteword during deployment
   */
  uint256 public constant percentMagnitudeLimit = type(uint64).max;
  /**
   * @notice an invariant that tracks how much underlying token is owned by a particular address
   */
  mapping(address => uint256) public withdrawableBalanceOf;
  /**
   * @notice a global denoting the number of tokens attributed to addresses
   * @dev this value provides a useful "before" value whenever tokens are moving
   */
  uint256 public tokensAttributed;
  /**
   * compute a useful value from 2 inputs
   * @param method the method to use to compute a result
   * @param x a primary magnitude to use - a constant held in settings - max value (2^64)-1
   * @param y a secondary magnitude to use - generally the amount of the end stake
   * @param stake the stake being operated over
   */
  function _computeMagnitude(
    uint256 method, uint256 x, uint256 y,
    IStakeable.StakeStore memory stake
  ) internal pure returns(uint256 amount) {
    // we can use unchecked here because all minuses (-)
    // are checked before they are run
    unchecked {
      if (method < 4) {
        if (method < 2) {
          // 0 remains 0
          if (method == 1) amount = y; // 1
        } else {
          if (method == 2) amount = x; // 2
          else amount = (x * y) / type(uint64).max; // 3 - % of total
        }
      } else if (method < 8) {
        if (method < 6) {
          if (method == 4) amount = (x * stake.stakedHearts) / type(uint64).max; // 4 - % of origination
          else amount = x * (y - stake.stakedHearts) / type(uint64).max; // 5 - % of yield
        } else {
          // day methods - y = currentDay
          uint256 stakedDays = stake.stakedDays;
          if (method == 6) amount = stakedDays; // 6 - repeat number of days
          else {
            // 7 - start an equally spaced ladder, even if end stake happens late
            uint256 lockedDay = stake.lockedDay;
            uint256 daysAfterLock = y - lockedDay;
            if (daysAfterLock == stakedDays) amount = stakedDays; // ended on first available day (most cases)
            else {
              // did not end on first available day
              if (daysAfterLock >= stakedDays) {
                // presumptive value extrapolated backward
                lockedDay = y - (daysAfterLock % (stakedDays + 1));
              } // else locked day was last presumptive locked day
              amount = stakedDays - (y - lockedDay);
            }
          }
        }
      }
      return amount;
    }
  }
  /**
   * compute a magnitude given an x and y
   * @param method the method to use to compute the result
   * @param x the first value as input
   * @param y the second value as input
   */
  function computeMagnitude(
    uint256 method, uint256 x, uint256 y,
    IStakeable.StakeStore memory stake
  ) external pure returns(uint256) {
    return _computeMagnitude(method, x, y, stake);
  }
  /**
   * computes a magnitude from the provided values
   * @param stakeId the stake id to get settings for
   * @param y the value to supply as a secondary magnitude
   */
  function computeEnderTip(
    uint256 stakeId,
    uint256 y
  ) external view returns(uint256) {
    uint256 settings = idToSettings[stakeId];
    return _computeMagnitude(
      settings >> 248, settings << 8 >> 192, y,
      _stakeById(stakeId)
    );
  }
  function _stakeById(uint256 stakeId) internal view returns(IStakeable.StakeStore memory) {
    return _getStake(address(this), stakeIdToIndex[stakeId]);
  }
  /**
   * adds a balance to the provided staker of the magnitude given in amount
   * @param staker the staker to add a withdrawable balance to
   * @param amount the amount to add to the staker's withdrawable balance as well as the attributed tokens
   */
  function _addToWithdrawable(address staker, uint256 amount) internal {
    unchecked {
      withdrawableBalanceOf[staker] = withdrawableBalanceOf[staker] + amount;
      tokensAttributed = tokensAttributed + amount;
    }
  }
  /**
   * deduce an amount from the provided account
   * @param account the account to deduct funds from
   * @param amount the amount of funds to deduct
   * @notice after a deduction, funds could be considered "unattributed"
   * and if they are left in such a state they could be picked up by anyone else
   */
  function _deductWithdrawable(address account, uint256 amount) internal returns(uint256) {
    uint256 withdrawable = withdrawableBalanceOf[account];
    if (amount == 0) {
      amount = withdrawable; // overflow protection
    } else if (withdrawable < amount) {
      revert NotEnoughFunding(withdrawable, amount);
    }
    unchecked {
      withdrawableBalanceOf[account] = withdrawable - amount;
      tokensAttributed = tokensAttributed - amount;
    }
    return amount;
  }
  /**
   * updates settings under a stake id to the provided settings struct
   * @param stakeId the stake id to update
   * @param settings the settings to update the stake id to
   */
  function updateSettings(uint256 stakeId, Settings calldata settings) external payable {
    _verifyStakeOwnership(msg.sender, stakeId);
    _logSettingsUpdate(stakeId, _encodeSettings(settings));
  }
  function _verifyStakeOwnership(address owner, uint256 stakeId) internal view {
    if (stakeIdToOwner[stakeId] != owner) {
      revert StakeNotOwned(owner, stakeIdToOwner[stakeId]);
    }
  }
  /**
   * end a stake for someone other than the sender of the transaction
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(
    uint256 stakeId
  ) external payable returns(uint256 delta) {
    return _stakeEndByConsent(stakeId, false);
  }
  /**
   * end a stake with the consent of the underlying staker's settings
   * @param stakeId the stake id to end
   * @param skipEarlyCheck used when early end stake check happens external to this method
   * @return delta the amount of hex at the end of the stake (consumed by _directFunds)
   * @notice hedron minting happens as last step before end stake
   */
  function _stakeEndByConsent(
    uint256 stakeId, bool skipEarlyCheck
  ) internal returns(uint256 delta) {
    uint256 idx = stakeIdToIndex[stakeId];
    IStakeable.StakeStore memory stake = _getStake(address(this), idx);
    if (idx == 0 && stakeId != stake.stakeId) {
      return 0;
    }
    uint256 settings = idToSettings[stakeId];
    uint256 consentAbilities = uint8(settings);
    uint256 today = _currentDay();
    if (!skipEarlyCheck && ((stake.lockedDay + stake.stakedDays) < today) && !_isCapable(consentAbilities, 1)) {
      return 0;
    }
    if (!_isCapable(consentAbilities, 0)) {
      return 0;
    }
    address staker = stakeIdToOwner[stakeId];
    // consent has been confirmed
    if (_isCapable(consentAbilities, 3)) {
      _attributeLegacyHedron(staker, _mintLegacyNative(stakeId));
    }
    delta = _stakeEnd(
      idx, stakeId
    );
    _directFunds(
      staker,
      delta, stakeId,
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
    uint256 stakeId;
    uint256 i;
    uint256 len = stakeIds.length;
    do {
      stakeId = stakeIds[i];
      _stakeEndByConsent(stakeId, false);
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
    _depositTokenFrom(msg.sender, amount);
    // tokens are essentially unattributed at this point
    stakeId = _stakeStartFor(
      to,
      amount, newStakedDays
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
      _logSettingsUpdate(stakeId, settings);
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
      // we can only conclude that the sender has authorized this deduction
      _deductWithdrawable(msg.sender, amount), newStakedDays
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
      _clamp(amount, _getUnattributed()), newStakedDays
    );
    _logSettings(stakeId, settings);
  }
  /**
   * gets unattributed tokens floating in the contract
   */
  function _getUnattributed() view internal returns(uint256) {
    return _getBalance() - tokensAttributed;
  }
  /**
   * gets the amount of unattributed tokens
   */
  function getUnattributed() external view returns(uint256) {
    return _getUnattributed();
  }
  /**
   * given a provided input amount, clamp the input to a maximum, using maximum if 0 provided
   * @param amount the requested or input amount
   * @param max the maximum amount that the value can be
   */
  function clamp(uint256 amount, uint256 max) external pure returns(uint256) {
    return _clamp(amount, max);
  }
  /**
   * clamp a given amount to the maximum amount
   * use the maximum amount if no amount is requested
   * @param amount the amount requested by another function
   * @param max the limit that the value can be
   */
  function _clamp(uint256 amount, uint256 max) internal pure returns(uint256) {
    if (amount == 0) {
      return max;
    }
    return amount > max ? max : amount;
  }
  /**
   * transfer a given number of tokens to the contract to be used by the contract's methods
   * @param amount the number of tokens to transfer to the contract
   * @notice an extra layer of protection is provided by this method
   * and can be refused by calling the dangerous version
   */
  function depositToken(uint256 amount) external payable {
    // transfer token to contract
    _depositTokenFrom(msg.sender, amount);
    _addToWithdrawable(msg.sender, amount);
  }
  /**
   * deposit an amount of tokens to the contract and attribute
   * them to the provided address
   * @param to the account to give ownership over tokens
   * @param amount the amount of tokens
   */
  function depositTokenTo(address to, uint256 amount) external payable {
    _depositTokenFrom(msg.sender, amount);
    _addToWithdrawable(to, amount);
  }
  /**
   * collect unattributed tokens and send to recipient of choice
   * @param transferOut transfers tokens to the provided address
   * @param to the address to receive or have tokens attributed to
   * @param amount the requested amount - clamped to the amount unattributed
   * @notice when 0 is passed, withdraw maximum available
   * or in other words, all unattributed tokens
   */
  function collectUnattributed(
    bool transferOut, address to,
    uint256 amount
  ) external payable {
    uint256 withdrawable = _clamp(amount, _getUnattributed());
    if (withdrawable > 0) {
      if (transferOut) {
        _withdrawTokenTo(to, withdrawable);
      } else {
        _addToWithdrawable(to, withdrawable);
      }
    }
  }
  /**
   * transfer an amount of tokens currently attributed to the withdrawable balance of the sender
   * @param to the to of the funds
   * @param amount the amount that should be deducted from the sender's balance
   */
  function withdrawTokenTo(address to, uint256 amount) external payable {
    _withdrawTokenTo(to, _deductWithdrawable(msg.sender, amount));
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
    uint256 delta, uint256 stakeId,
    uint256 today,
    uint256 settings,
    IStakeable.StakeStore memory stake
  ) internal {
    uint256 tipMethod = settings >> 248;
    if (tipMethod > 0) {
      uint256 tip = _computeMagnitude(
        tipMethod, settings << 8 >> 192, delta,
        stake
      );
      // because we do not set a var for you to collect unattributed tokens
      // it must be done at the end
      tip = tip > delta ? delta : tip;
      unchecked {
        delta = delta - tip;
      }
    }
    uint256 withdrawableMethod = settings << 72 >> 248;
    if (withdrawableMethod > 0) {
      uint256 toWithdraw = _computeMagnitude(
        withdrawableMethod, settings << 80 >> 192, delta,
        stake
      );
      // we have to keep this delta outside of the unchecked block
      // in case someone sets a magnitude that is too high
      toWithdraw = toWithdraw > delta ? delta : toWithdraw;
      if (toWithdraw > 0) {
        unchecked {
          delta = delta - toWithdraw; // checks for underflow
        }
        _withdrawTokenTo(staker, toWithdraw);
      }
    }
    uint256 newStakeMethod = settings << 144 >> 248;
    if (newStakeMethod > 0) {
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
        uint256 nextStakeId = _stakeStartFor(
          staker,
          newStakeAmount, newStakeDays
        );
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
          _logSettingsUpdate(nextStakeId, settings);
        } else {
          // keep the authorization settings
          _logSettingsUpdate(nextStakeId, uint256(uint8(settings)));
        }
      }
    }
    if (delta > 0) {
      _addToWithdrawable(staker, delta);
    }
    // this data should still be available in logs
    idToSettings[stakeId] = 0;
  }
}
