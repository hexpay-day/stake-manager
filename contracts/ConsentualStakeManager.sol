// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./StakeManager.sol";

contract ConsentualStakeManager is StakeManager, EIP712 {
  // 1 word;
  struct Settings {
    uint8 tipMethod;
    uint64 tipMagnitude;
    // used as a percentage
    uint8 withdrawableMethod;
    uint64 withdrawableMagnitude;
    // the rest goes into a new stake if the number of days are set
    uint8 newStakeMethod;
    uint64 newStakeMagnitude;
    uint8 newStakeDaysMethod;
    uint16 newStakeDaysMagnitude;
    uint8 consentAbilities; // 0/1 start, 00/10 end, 000/100 early end
    uint8 copyIterations;
  }
  /**
   * an event to signal that settings to direct funds
   * at the end of a stake have been updated
   * @param stakeId the stake id that was updated
   * @param settings the newly updated settings
   */
  event UpdatedSettings(uint256 indexed stakeId, uint256 settings);
  /**
   * @notice nonce has been consumed
   */
  error NonceConsumed(address signer, uint256 nonce);
  /**
   * @notice an error for when the stake is about to be ended but conditions have not allowed it
   */
  error StakeNotEnded(uint256 provided, uint256 expected);
  /**
   * @notice this error is thrown when the stake in question
   * is not owned by the expected address
   */
  error StakeNotOwned(address provided, address expected);
  /**
   * @notice the signature was invalid / did not match the data
   */
  error InvalidSignature();
  /**
   * @notice settings of stakes indexed by the stake id
   */
  mapping(uint256 => uint256) public stakeIdToSettings;
  /**
   * @notice an invariant that tracks how much underlying token is owned by a particular address
   */
  mapping(address => uint256) public withdrawableBalanceOf;
  /**
   * @notice this is a globally shared pool of nonces - all methods draw from this pool
   * we use bool here because we do not indend a pathway to delete
   */
  mapping(address => mapping(uint256 => bool)) public signerToNonceConsumed;
  /**
   * creates the internal stake ender contract
   */
  constructor()
    StakeManager()
    EIP712("ConsentualStakeManager", "0.0.0")
  {}
  /**
   * computes a magnitude from the provided values
   * @param index the index of the stake to check the ender tip for
   * @param stakeId the stake id to get settings for
   * @param y the value to supply as a secondary magnitude
   */
  function computeEnderTip(bool internallyManaged, uint256 index, uint256 stakeId, uint256 y) external view returns(uint256) {
    uint256 settings = stakeIdToSettings[stakeId];
    address custodian = internallyManaged ? address(this) : isolatedStakeManagers[stakeIdToOwner[stakeId]];
    IStakeable.StakeStore memory stake = _getStake(custodian, index);
    return _computeMagnitude(
      settings >> 248, settings << 8 >> 192, y,
      stake
    );
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
      revert NotEnoughFunding(amount, withdrawable);
    }
    unchecked {
      withdrawableBalanceOf[account] = withdrawable - amount;
      tokensAttributed = tokensAttributed - amount;
    }
    return amount;
  }
  /**
   * update the settings for a stake id
   * @param stakeId the stake id to update settings for
   * @param settings an object that holds settings values
   * to inform end stakers how to handle the stake
   */
  function _logSettingsUpdate(
    uint256 stakeId,
    uint256 settings
  ) internal {
    stakeIdToSettings[stakeId] = settings;
    emit UpdatedSettings(stakeId, settings);
  }
  /**
   * updates settings under a stake id to the provided settings struct
   * @param stakeId the stake id to update
   * @param settings the settings to update the stake id to
   */
  function updateSettings(uint256 stakeId, Settings calldata settings) external payable {
    _verifyEndableStakeOwnership(msg.sender, stakeId);
    _logSettingsUpdate(stakeId, _encodeSettings(settings));
  }
  function _verifyEndableStakeOwnership(address owner, uint256 stakeId) internal view {
    if (stakeIdToOwner[stakeId] != owner) {
      revert StakeNotOwned(owner, stakeIdToOwner[stakeId]);
    }
  }
  /**
   * end a stake for someone other than the sender of the transaction
   * @param internallyManaged whether or not the stake is held internally
   * @param staker the staker's account
   * @param stakeId the stake id on the underlying contract to end
   */
  function stakeEndByConsent(
    address staker, bool skipIdMismatch, bool internallyManaged,
    uint256 stakeIndex, uint256 stakeId
  ) external payable returns(uint256) {
    address custodian = internallyManaged ? address(this) : isolatedStakeManagers[staker];
    IStakeable.StakeStore memory stake = _getStake(custodian, stakeIndex);
    if (stake.stakeId != stakeId && skipIdMismatch) {
      return 0;
    }
    return _stakeEndByConsent(
      internallyManaged, staker, stakeIndex, stakeId,
      stake
    );
  }
  /**
   * end a stake with the consent of the underlying staker
   * @param internallyManaged the instantiation of the owned list of stakes
   * @param staker the underlying staker themselves
   * @param stakeId stake id of the stake to end - idempotency key
   * and to ensure that the stake is available after it is deleted on the underlying contract
   * @notice validation must be done externally to ensure that this stake can be ended
   * @dev validations internal to this method include
   * 1) stake has ended or settings are such that consent has been granted
   * 2) staker config is not (0) meaning that the staker wishes to manage the list of stakes themselves
   * @dev if consent abilities is < 2 that is a blanket ask to not allow for end stakes by consent
   * if consent abilities is < 4 then there is no consent given for early ending
   */
  function _stakeEndByConsent(
    bool internallyManaged, address staker,
    uint256 stakeIndex, uint256 stakeId,
    IStakeable.StakeStore memory stake
  ) internal returns(uint256) {
    uint256 settings = stakeIdToSettings[stakeId];
    uint256 consentAbilities = settings << 240 >> 248;
    if (!_stakeIsEnded(stake) && consentAbilities < 4) {
      revert StakeNotEnded(_currentDay(), stake.lockedDay + stake.stakedDays);
    }
    if (consentAbilities < 2) {
      revert NotAllowed();
    }
    // consent has been confirmed
    uint256 delta = _stakeEnd(
      internallyManaged, staker, stakeIndex, stakeId
    );
    _directFunds(
      internallyManaged, staker,
      delta, stakeId,
      settings,
      stake
    );
    return delta;
  }
  struct StakeInfo {
    bool internallyManaged;
    address staker;
    uint256 stakeIndex;
    uint256 stakeId;
  }
  /**
   * end many stakes at the same time
   * provides an optimized path for all stake ends
   * and assumes that detectable failures should be skipped
   * @param stakeEnds a struct holding data for singular end stakes
   * @notice this method should, generally, only be called when multiple enders
   * are attempting to end stake the same stakes
   */
  function stakeEndByConsentForMany(StakeInfo[] calldata stakeEnds) external payable {
    bool internallyManaged;
    address custodian;
    address staker;
    StakeInfo calldata stakeInfo;
    uint256 i;
    uint256 stakeIndex;
    uint256 stakeId;
    uint256 len = stakeEnds.length;
    do {
      stakeInfo = stakeEnds[i];
      internallyManaged = stakeInfo.internallyManaged;
      staker = stakeInfo.staker;
      stakeIndex = stakeInfo.stakeIndex;
      stakeId = stakeInfo.stakeId;
      custodian = internallyManaged ? address(this) : isolatedStakeManagers[staker];
      IStakeable.StakeStore memory stake = _getStake(custodian, stakeIndex);
      if (stake.stakeId == stakeId) {
        _stakeEndByConsent(
          internallyManaged, staker, stakeIndex, stakeId,
          stake
        );
      }
      unchecked {
        ++i;
      }
    } while(i < len);
  }
  /**
   * start a stake from the withdrawable values
   * @param amount thee number of token to start a stake, deducting from the withdrawable numberr
   * @param newStakedDays the number of days to stake for
   */
  function stakeStartFromWithdrawable(
    bool internallyManaged, uint256 amount, uint256 newStakedDays
  ) external payable {
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, msg.sender,
      _deductWithdrawable(msg.sender, amount), newStakedDays
    ), newStakedDays);
  }
  function _setDefaultSettings(uint256 stakeId, uint256 stakeDays) internal {
    stakeIdToSettings[stakeId] = uint256(0x00000000000000000000000000000000000001000000000000000001000003ff) | (stakeDays << 16);
  }
  function readEncodedSettings(
    uint256 settings,
    uint256 fromEnd, uint256 length
  ) external pure returns(uint256) {
    return _readEncodedSettings(settings, fromEnd, length);
  }
  function _readEncodedSettings(
    uint256 settings,
    uint256 fromEnd, uint256 length
  ) internal pure returns(uint256) {
    return settings << fromEnd >> (256 - length);
  }
  function _updateEncodedSettings(
    uint256 settings,
    uint256 value,
    uint256 from, uint256 to
  ) internal pure returns(uint256) {
    return (settings >> from << from) | (value << from) | (settings << to >> to);
  }
  function _encodeSettings(Settings memory settings) internal pure returns(uint256 baseline) {
    return uint256(settings.tipMethod) << 248
      | uint256(settings.tipMagnitude) << 184
      | uint256(settings.withdrawableMethod) << 176
      | uint256(settings.withdrawableMagnitude) << 112
      | uint256(settings.newStakeMethod) << 104
      | uint256(settings.newStakeMagnitude) << 40
      | uint256(settings.newStakeDaysMethod) << 32
      | uint256(settings.newStakeDaysMagnitude) << 16
      | uint256(settings.consentAbilities) << 8
      | uint256(settings.copyIterations);
  }
  function _defaultSettings(uint256 stakeDays) internal pure returns(Settings memory) {
    return Settings(
      uint8(0), uint64(0), // tip
      uint8(0), uint64(0), // withdrawable
      uint8(1), uint64(0), // new stake amount
      uint8(1), uint16(stakeDays), // new stake days
      uint8(3), // "011" allow start and end stake
      type(uint8).max
    );
  }
  function defaultSettings(uint256 stakeDays) external pure returns(Settings memory) {
    return _defaultSettings(stakeDays);
  }
  function defaultEncodedSettings(uint256 stakeDays) external pure returns(uint256) {
    return _encodeSettings(_defaultSettings(stakeDays));
  }
  function stakeStartFromBalance(
    bool internallyManaged, uint256 amount, uint256 newStakedDays
  ) external payable {
    _depositTokenFrom(msg.sender, amount);
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, msg.sender,
      amount, newStakedDays
    ), newStakedDays);
  }
  function stakeStartFromBalanceFor(
    bool internallyManaged, address to,
    uint256 amount, uint256 newStakedDays
  ) external payable {
    _depositTokenFrom(msg.sender, amount);
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, to,
      amount, newStakedDays
    ), newStakedDays);
  }
  /**
   * start a numbeer of stakes for an address from the withdrawable
   * @param staker the account to start a stake for
   * @param amount the number of tokens to start a stake for
   * @param newStakedDays the number of days to stake for
   */
  function stakeStartFromWithdrawableFor(
    bool internallyManaged, address staker,
    uint256 amount, uint256 newStakedDays
  ) external payable {
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, staker,
      _deductWithdrawable(msg.sender, amount), newStakedDays
    ), newStakedDays);
  }
  function stakeStartFromUnattributed(
    bool internallyManaged, uint256 amount, uint256 newStakedDays
  ) external payable {
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, msg.sender,
      _clamp(amount, _getUnattributed()), newStakedDays
    ), newStakedDays);
  }
  function stakeStartFromUnattributedFor(
    bool internallyManaged, address staker,
    uint256 amount, uint256 newStakedDays
  ) external payable {
    _setDefaultSettings(_stakeStartFor(
      internallyManaged, staker,
      _clamp(amount, _getUnattributed()), newStakedDays
    ), newStakedDays);
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
   * transfer a given number of tokens to the contract to be used by the contract's methods
   * @param amount the number of tokens to transfer to the contract
   * @notice this is the dangerous version of the deposit token method
   * if you are using this method, you should be using it with the purpose
   * of multicalling and disallowing failures (aka revert if any fail)
   * if you do not, you are at risk of losing your funds to the next transaction
   * @dev only the sender can be considered to be consenting to this action
   */
  function depositTokenDangerous(uint256 amount) external payable {
    _depositTokenFrom(msg.sender, amount);
  }
  /**
   * collect unattributed tokens and send to recipient of choice
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
    bool internallyManaged, address staker,
    uint256 delta, uint256 stakeId,
    uint256 settings,
    IStakeable.StakeStore memory stake
  ) internal {
    uint256 tipMethod = settings << 0 >> 248;
    if (tipMethod > 0) {
      uint256 tip = _computeMagnitude(
        tipMethod, settings << 8 >> 192, delta,
        stake
      );
      // because we do not set a var for you to collect unattributed tokens
      // it must be done at the end
      unchecked {
        delta = delta - (tip > delta ? delta : tip);
      }
    }
    uint256 toWithdraw;
    uint256 withdrawableMethod = settings << 72 >> 248;
    if (withdrawableMethod > 0) {
      toWithdraw = _computeMagnitude(
        withdrawableMethod, settings << 80 >> 192, delta,
        stake
      );
      // we have to keep this delta outside of the unchecked block
      // in case someone sets a magnitude that is too high
      unchecked {
        delta = delta - (toWithdraw > delta ? delta : toWithdraw); // checks for underflow
      }
      _withdrawTokenTo(staker, toWithdraw);
    }
    uint256 newStakeMethod = settings << 144 >> 248;
    if (newStakeMethod > 0) {
      uint256 newStakeAmount = _computeMagnitude(
        newStakeMethod, settings << 152 >> 192, delta,
        stake
      );
      uint256 newStakeDays = _computeMagnitude(
        settings << 216 >> 248, settings << 232 >> 240, stake.stakedDays,
        stake
      );
      unchecked {
        delta = delta - (newStakeAmount > delta ? delta : newStakeAmount); // checks for underflow
      }
      uint256 nextStakeId = _stakeStartFor(
        internallyManaged, staker,
        newStakeAmount, newStakeDays
      );
      uint256 copyIterations = settings << 240 >> 248;
      if (copyIterations > 1) {
        unchecked {
          copyIterations = copyIterations - 1;
        }
        // settings will be maintained for the new stake
        _logSettingsUpdate(nextStakeId, settings);
      }
    }
    if (delta > 0) {
      _addToWithdrawable(staker, delta);
    }
    // this data should still be available in logs
    delete stakeIdToSettings[stakeId];
  }
  /**
   * signal to enders that early ending is or is not allowed
   * @param staker the staker that gave consent to early end stake
   * @param stakeId the stake id in question
   * @param state the state to change the allow early end to
   */
  function _consentEarlyEnd(
    address staker, bool state,
    uint256 stakeId
  ) internal {
    if (stakeIdToOwner[stakeId] == staker) {
      stakeIdConsentEarlyEnd[stakeId] = state;
      emit UpdateConsentEarlyEnd(stakeId);
    }
  }
  /**
   * signal to enders that early ending is or is not allowed
   * @param stakeId the stake id in question
   * @param state the state of the early end flag
   */
  function consentEarlyEnd(uint256 stakeId, bool state) external payable {
    _consentEarlyEnd(msg.sender, state, stakeId);
  }
  /**
   * verify a signature in a general way to reveal consent on an
   * operation over a stake id
   * @param hashedInput the hashed input that you wish to check
   * @param nonce the nonce presented to allow for reversals
   * @param signature the signature presented claiming consent
   */
  function _verifySignature(
    bytes32 hashedInput,
    uint256 nonce,
    bytes calldata signature
  ) internal returns(address) {
    bytes32 digest = _hashTypedDataV4(hashedInput);
    address signer = ECDSA.recover(digest, signature);
    if (signer == address(0)) {
      revert InvalidSignature();
    }
    if (signerToNonceConsumed[signer][nonce]) {
      revert NonceConsumed(signer, nonce);
    }
    signerToNonceConsumed[signer][nonce] = true;
    return signer;
  }
  /**
   * show consent to early end stake by providing a singature
   * @param skipIdMismatch skip the end staking process if the id provided
   * @param stakeIndex the index where the corresponding stake id resides
   * @param earliestDay the earliest day that the stake can be ended
   * @param stakeId the stake id in question
   * @param nonce a nonce associated with the signature - used to cancel out signatures
   * @param signature the signature proving consent to end the stake
   * does not match the one at the index
   * @notice if the earliest day does not match the signature
   * or that day has not been reached then the method will fail
   */
  function stakeEndBySignature(
    address staker, bool skipIdMismatch, bool internallyManaged,
    uint256 stakeIndex, uint256 stakeId,
    uint256 earliestDay, uint256 nonce,
    bytes calldata signature
  ) external payable returns(uint256) {
    address custodian = internallyManaged ? address(this) : isolatedStakeManagers[staker];
    IStakeable.StakeStore memory stake = _getStake(custodian, stakeIndex);
    if (stake.stakeId != stakeId && skipIdMismatch) {
      return 0;
    }
    if (_currentDay() < earliestDay) {
      revert StakeNotEnded(earliestDay, _currentDay());
    }
    bytes32 hashedInput = keccak256(abi.encode(
      keccak256("ConsentEarlyEnd(uint256 earliestDay,uint256 stakeId,uint256 nonce)"),
      earliestDay,
      stakeId,
      nonce
    ));
    _verifyEndableStakeOwnership(_verifySignature(hashedInput, nonce, signature), stakeId);
    return _stakeEndByConsent(
      internallyManaged, staker, stakeIndex, stakeId,
      stake
    );
  }
  /**
   * show consent for updating settings on a particular stake id
   * @param stakeId the stake id to operate on
   * @param nonce the globally shared nonce
   * @param settings the settings to update to
   * @param signature the signature showing consent
   * @dev this method does not make sense to run until it is economically reasonable to do so
   * which may mean collecting signatures throughout the day and
   * running them at the end before the day ticks over such that you reduce sloads
   */
  function updateSettingsBySignature(
    uint256 stakeId, uint256 nonce,
    Settings calldata settings,
    bytes calldata signature
  ) external payable {
    bytes32 hashedInput = keccak256(abi.encode(
      keccak256("ConsentUpdateSettings(uint256 stakeId,uint256 nonce,(uint8,uint64,uint8,uint64,uint8,uint64,uint16,uint8,uint16) settings)"),
      stakeId,
      nonce,
      settings
    ));
    address signer = _verifySignature(hashedInput, nonce, signature);
    _verifyEndableStakeOwnership(signer, stakeId);
    return _logSettingsUpdate(stakeId, _encodeSettings(settings));
  }
  function withdrawTokenToBySignature(
    address to, uint256 amount,
    uint256 nonce,
    bytes calldata signature
  ) external payable {
    bytes32 hashedInput = keccak256(abi.encode(
      keccak256("ConsentWithdrawTokenTo(address to,uint256 amount,uint256 nonce)"),
      to,
      amount,
      nonce
    ));
    address signer = _verifySignature(hashedInput, nonce, signature);
    _withdrawTokenTo(to, _deductWithdrawable(signer, amount));
  }
}
