// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Address.sol";
import "./SingletonHedronManager.sol";
import "./Magnitude.sol";

contract SingletonStakeManager is SingletonHedronManager, Magnitude {
  using Address for address;
  using Address for address payable;
  uint256 public constant MAX_DAYS = 5555;
  /**
   * @notice a global denoting the number of tokens attributed to addresses
   * @dev this value provides a useful "before" value whenever tokens are moving
   */
  mapping(uint256 => uint256[]) public stakeIdToTip;
  address[] public indexToToken;
  mapping(address => uint256) public currencyToIndex;
  event AddTip(uint256 indexed stakeId, address indexed token, uint256 indexed index, uint256 setting);
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
  constructor() {
    _addCurrencyToTipList(address(0));
    // this line allows hex to be tipped by factor of basefee
    _addCurrencyToTipList(target);
    _addCurrencyToTipList(hedron);
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
  function stakeEndByConsent(
    uint256 stakeId
  ) external payable returns(uint256 delta) {
    return _stakeEndByConsent(stakeId);
  }
  /**
   * end a stake with the consent of the underlying staker's settings
   * @param stakeId the stake id to end
   * @return delta the amount of hex at the end of the stake (consumed by _directFunds)
   * @notice hedron minting happens as last step before end stake
   */
  function _stakeEndByConsent(
    uint256 stakeId
  ) internal returns(uint256 delta) {
    (uint256 idx, address staker) = _stakeIdToInfo(stakeId);
    IStakeable.StakeStore memory stake = _stakeByIndex(idx);
    if (idx == 0 && stakeId != stake.stakeId) {
      return 0;
    }
    uint256 settings = idToSettings[stakeId];
    uint256 consentAbilities = uint8(settings);
    uint256 today = _currentDay();
    if (((stake.lockedDay + stake.stakedDays) > today) && !_isCapable(consentAbilities, 1)) {
      return 0;
    }
    if (!_isCapable(consentAbilities, 0)) {
      return 0;
    }
    if (_isCapable(consentAbilities, 3)) {
      // consent has been confirmed
      uint256 hedronAmount = _mintNativeHedron(idx, stakeId);
      uint256 hedronTipMethod = settings >> 248;
      if (hedronTipMethod > 0) {
        uint256 tip = _computeMagnitude(
          hedronTipMethod, settings << 8 >> 192, delta,
          stake
        );
        // because we do not set a var for you
        // to collect unattributed tokens
        // it must be done at the end
        tip = tip > hedronAmount ? hedronAmount : tip;
        if (tip > 0) {
          unchecked {
            hedronAmount = hedronAmount - tip;
          }
          emit Tip(stakeId, staker, hedron, tip);
        }
      }
      _attributeHedron(staker, hedronAmount);
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
    uint256 stakeId;
    uint256 i;
    uint256 len = stakeIds.length;
    do {
      stakeId = stakeIds[i];
      _stakeEndByConsent(stakeId);
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

  function depositTip(
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external payable returns(uint256, uint256) {
    amount = _depositTokenFrom(token, msg.sender, amount);
    if (amount == 0) {
      // cannot allow other people to take staker deposits
      revert NotAllowed();
    }
    (, address recipient) = _stakeIdToInfo(stakeId);
    _addToTokenWithdrawable(token, recipient, amount);
    // do now allow for overriding of tip settings, only increase in gas token
    return _addTipToStake(token, recipient, stakeId, amount, numerator, denominator);
  }
  function addCurrencyToTipList(address token) external {
    // token must already exist - helps prevent grief attacks
    if (!token.isContract()) {
      revert NotAllowed();
    }
    if (IERC20(token).totalSupply() > type(uint88).max) {
      revert NotAllowed();
    }
    _addCurrencyToTipList(token);
  }
  function _addCurrencyToTipList(address token) internal {
    currencyToIndex[token] = indexToToken.length;
    indexToToken.push(token);
  }
  function removeTipFromStake(
    uint256 stakeId,
    uint256[] calldata indexes
  ) external payable {
    // if the stake has already ended, we don't care
    // who sends funds back to staking address
    // only one who is incensed to unwind tips is the staker
    // but realistically, anyone can if they wish
    if (stakeIdInfo[stakeId] != 0) {
      _verifyStakeOwnership(msg.sender, stakeId);
    }
    uint256[] storage tips = stakeIdToTip[stakeId];
    // this will fail if no tips exist
    uint256 tipsLast = tips.length - 1;
    uint256 len = indexes.length;
    uint256 i;
    do {
      uint256 tip = tips[indexes[i]];
      if (tipsLast > 0) {
        tips[indexes[i]] = tips[tipsLast];
      }
      tips.pop();
      // now do something with the tip
      address token = address(indexToToken[tip >> 224]);
      uint256 limit = uint96(tip >> 128);
      _addToTokenWithdrawable(token, msg.sender, limit);
      unchecked {
        --tipsLast;
        ++i;
      }
    } while (i < len);
  }
  function addTipToStake(
    address token,
    uint256 stakeId,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external returns(uint256, uint256) {
    return _addTipToStake(token, msg.sender, stakeId, amount, numerator, denominator);
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
    if (_stakeCount(address(this)) > 0) {
      uint256 existingStakeId = _stakeById(stakeId).stakeId;
      // cannot add a tip to a stake that has already ended
      if (existingStakeId != stakeId) {
        revert NotAllowed();
      }
    }
    // set the tip flag to 1
    // 0b00000001 | 0b00010000 => 0b00010001
    // 0b00010001 | 0b00010000 => 0b00010001
    uint256 currentSettings = idToSettings[stakeId];
    uint256 updatedSettings = currentSettings | (1 << 4);
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
    uint256 index = stakeIdToTip[stakeId].length;
    stakeIdToTip[stakeId].push(setting);
    emit AddTip(stakeId, token, index, setting);
    return (index, amount);
  }
  function encodeTipSettings(
    uint256 currencyIndex,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) external pure returns(uint256) {
    return _encodeTipSettings(currencyIndex, amount, numerator, denominator);
  }
  function _encodeTipSettings(
    uint256 currencyIndex,
    uint256 amount,
    uint256 numerator,
    uint256 denominator
  ) internal pure returns(uint256) {
    return (currencyIndex << 224)
      | (amount << 128)
      | (uint256(uint64(numerator)) << 64)
      | uint256(uint64(denominator));
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
    if (_isCapable(settings, 4)) {
      uint256 i;
      uint256 len = stakeIdToTip[stakeId].length;
      do {
        // the reason we can do this is because
        // it is unreasonable to try to provide a list of 0,
        // since nothing would be able to happen downstream
        uint256 tip = stakeIdToTip[stakeId][len - 1 - i];
        stakeIdToTip[stakeId].pop();
        address token = indexToToken[tip >> 224];
        if (uint128(tip) == 0) {
          tip = uint88(tip >> 128);
        } else {
          uint256 limit = uint88(tip >> 128);
          // after this point, the tip as written on chain
          // is not helpful to execution so we overwrite it
          tip = (uint64(tip >> 64) * block.basefee) / uint64(tip);
          if (limit > 0) {
            tip = _clamp(tip, limit);
            if (limit - tip > 0) {
              // put back unused tip
              unchecked {
                withdrawableBalanceOf[token][staker] += (limit - tip);
              }
            }
          } else {
            // we have to draw from deposited tokens
            tip = _clamp(tip, withdrawableBalanceOf[token][staker]);
            if (tip > 0) {
              unchecked {
                withdrawableBalanceOf[token][staker] -= tip;
              }
            }
          }
        }
        if (tip > 0) {
          emit Tip(stakeId, staker, token, tip);
          // this allows the tip to be free floating
          // and picked up by the unattributed methods
          unchecked {
            attributed[token] -= tip;
          }
        }
        unchecked {
          ++i;
        }
      } while (i < len);
    }
    uint256 targetTip = _checkTipAmount(settings >> 112, delta, stake);
    if (targetTip > 0) {
      // because we do not set a var for you
      // to collect unattributed tokens
      // it must be done at the end
      targetTip = targetTip > delta ? delta : targetTip;
      unchecked {
        delta = delta - targetTip;
      }
      emit Tip(stakeId, staker, target, targetTip);
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
        newStakeMethod = newStakeDays > MAX_DAYS ? MAX_DAYS : newStakeMethod;
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
          // remove consent abilities, put back the last 4 (0-3)
          // which removes the tip flag
          // also, remove the early end flag
          settings = (settings >> 8 << 8) | (settings << 252 >> 254 << 2) | 1;
          _logSettingsUpdate(nextStakeId, settings);
        } else {
          // keep the authorization settings
          // nulls out all other settings
          settings = (uint256(uint8(settings)) >> 2 << 2) | 1;
          _logSettingsUpdate(nextStakeId, settings);
        }
      }
    }
    if (delta > 0) {
      if (_isCapable(settings, 5)) {
        _withdrawTokenTo(target, payable(staker), delta);
      } else {
        _addToTokenWithdrawable(target, staker, delta);
      }
    }
    // this data should still be available in logs
    idToSettings[stakeId] = 0;
  }
}
