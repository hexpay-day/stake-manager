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
    error StakeNotEnded(uint96 provided, uint160 expected);
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
    function computeEnderTip(uint8 stakerConfig, uint88 index, uint64 stakeId, uint96 y) external view returns(uint256) {
        uint256 settings = stakeIdToSettings[stakeId];
        address custodian = stakerConfig == uint256(0) ? isolatedStakeManagers[stakeIdToOwner[stakeId]] : address(this);
        IStakeable.StakeStore memory stake = _getStake(custodian, index);
        return _computeMagnitude(
            uint8(settings << 0 >> (256 - 8)), uint64(settings << 8 >> (256 - 6)), y,
            stake
        );
    }
    /**
     * adds a balance to the provided staker of the magnitude given in amount
     * @param staker the staker to add a withdrawable balance to
     * @param amount the amount to add to the staker's withdrawable balance as well as the attributed tokens
     */
    function _addToWithdrawable(address staker, uint96 amount) internal {
        unchecked {
            withdrawableBalanceOf[staker] += amount;
            tokensAttributed += amount;
        }
    }
    /**
     * deduce an amount from the provided account
     * @param account the account to deduct funds from
     * @param amount the amount of funds to deduct
     * @notice after a deduction, funds could be considered "unattributed"
     * and if they are left in such a state they could be picked up by anyone else
     */
    function _deductWithdrawable(address account, uint96 amount) internal returns(uint256) {
        uint256 withdrawable = withdrawableBalanceOf[account];
        if (amount == 0) {
            amount = uint96(withdrawable); // overflow protection
        } else if (withdrawable < amount) {
            revert NotEnoughFunding(amount, uint128(withdrawable));
        }
        withdrawableBalanceOf[account] = withdrawable - amount;
        unchecked {
            tokensAttributed -= amount;
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
        _verifyEndableStakeOwnership(msg.sender, uint96(stakeId));
        _logSettingsUpdate(stakeId, _encodeSettings(settings));
    }
    function _verifyEndableStakeOwnership(address owner, uint96 stakeId) internal view {
        if (stakeIdToOwner[stakeId] != owner) {
            revert StakeNotOwned(owner, stakeIdToOwner[stakeId]);
        }
    }
    /**
     * end a stake for someone other than the sender of the transaction
     * @param stakerConfig whether or not the stake is held internally
     * @param staker the staker's account
     * @param stakeId the stake id on the underlying contract to end
     */
    function stakeEndByConsent(
        uint8 stakerConfig, address staker, uint40 stakeIndex, uint40 stakeId, bool skipIdMismatch
    ) external payable returns(uint256) {
        address custodian = stakerConfig == uint256(0) ? isolatedStakeManagers[staker] : address(this);
        IStakeable.StakeStore memory stake = _getStake(custodian, stakeIndex);
        if (stake.stakeId != stakeId && skipIdMismatch) {
            return 0;
        }
        return _stakeEndByConsent(
            stakerConfig, staker, stakeIndex, stakeId,
            stake
        );
    }
    /**
     * end a stake with the consent of the underlying staker
     * @param stakerConfig the instantiation of the owned list of stakes
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
        uint8 stakerConfig, address staker, uint56 stakeIndex, uint40 stakeId,
        IStakeable.StakeStore memory stake
    ) internal returns(uint256) {
        uint256 settings = stakeIdToSettings[stakeId];
        uint256 consentAbilities = settings << 240 >> (256 - 8);
        if (!_stakeIsEnded(stake) && consentAbilities < 4) {
            revert StakeNotEnded(uint96(_currentDay()), stake.lockedDay + stake.stakedDays);
        }
        if (consentAbilities < 2) {
            revert NotAllowed();
        }
        // consent has been confirmed
        uint256 delta = _stakeEnd(
            stakerConfig, staker, stakeIndex, uint40(stakeId)
        );
        return _directFunds(
            stakerConfig, staker,
            uint96(delta), stakeId,
            settings,
            stake
        );
    }
    struct StakeInfo {
        uint8 stakerConfig;
        address staker;
        uint48 stakeIndex;
        uint40 stakeId;
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
        uint256 i;
        uint256 len = stakeEnds.length;
        do {
            StakeInfo calldata stakeInfo = stakeEnds[i];
            uint8 stakerConfig = stakeInfo.stakerConfig;
            address staker = stakeInfo.staker;
            uint48 stakeIndex = stakeInfo.stakeIndex;
            uint40 stakeId = stakeInfo.stakeId;
            address custodian = stakerConfig == uint256(0) ? isolatedStakeManagers[staker] : address(this);
            IStakeable.StakeStore memory stake = _getStake(custodian, stakeIndex);
            if (stake.stakeId == stakeId) {
                _stakeEndByConsent(
                    stakerConfig, staker, stakeIndex, stakeId,
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
        uint8 stakerConfig, uint96 amount, uint152 newStakedDays
    ) external payable {
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, msg.sender,
            uint96(_deductWithdrawable(msg.sender, amount)), newStakedDays
        )), newStakedDays);
    }
    function _setDefaultSettings(uint40 stakeId, uint216 stakeDays) internal {
        stakeIdToSettings[stakeId] = _encodeSettings(_defaultSettings(stakeDays));
    }
    function readEncodedSettings(
        uint256 settings,
        uint128 fromEnd, uint128 length
    ) external pure returns(uint256) {
      return _readEncodedSettings(settings, fromEnd, length);
    }
    function _readEncodedSettings(
        uint256 settings,
        uint128 fromEnd, uint128 length
    ) internal pure returns(uint256) {
        return (settings << fromEnd >> (256 - length));
    }
    function _updateEncodedSettings(
        uint256 settings,
        uint256 value,
        uint128 from, uint128 to
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
        uint8 stakerConfig, uint96 amount, uint152 newStakedDays
    ) external payable {
        _depositTokenFrom(msg.sender, amount);
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, msg.sender,
            amount, newStakedDays
        )), newStakedDays);
    }
    function stakeStartFromBalanceFor(
        uint96 stakerConfig, address to,
        uint96 amount, uint160 newStakedDays
    ) external payable {
        _depositTokenFrom(msg.sender, amount);
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, to,
            amount, newStakedDays
        )), newStakedDays);
    }
    /**
     * start a numbeer of stakes for an address from the withdrawable
     * @param staker the account to start a stake for
     * @param amount the number of tokens to start a stake for
     * @param newStakedDays the number of days to stake for
     */
    function stakeStartFromWithdrawableFor(
        uint96 stakerConfig, address staker,
        uint96 amount, uint160 newStakedDays
    ) external payable {
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, staker,
            uint96(_deductWithdrawable(msg.sender, amount)), uint160(newStakedDays)
        )), newStakedDays);
    }
    function stakeStartFromUnattributed(
        uint8 stakerConfig, uint96 amount, uint152 newStakedDays
    ) external payable {
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, msg.sender,
            uint96(_clamp(amount, uint128(_getUnattributed()))), newStakedDays
        )), newStakedDays);
    }
    function stakeStartFromUnattributedFor(
        uint96 stakerConfig, address staker,
        uint96 amount, uint160 newStakedDays
    ) external payable {
        _setDefaultSettings(uint40(_stakeStartFor(
            stakerConfig, staker,
            uint96(_clamp(amount, uint128(_getUnattributed()))), newStakedDays
        )), newStakedDays);
    }
    /**
     * transfer a given number of tokens to the contract to be used by the contract's methods
     * @param amount the number of tokens to transfer to the contract
     * @notice an extra layer of protection is provided by this method
     * and can be refused by calling the dangerous version
     */
    function depositToken(uint96 amount) external payable {
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
    function depositTokenTo(address to, uint96 amount) external payable {
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
        _depositTokenFrom(msg.sender, uint96(amount));
    }
    /**
     * collect unattributed tokens and send to recipient of choice
     * @notice when 0 is passed, withdraw maximum available
     * or in other words, all unattributed tokens
     */
    function collectUnattributed(
        address to, uint96 amount,
        bool transferOut
    ) external payable {
        uint256 withdrawable = _clamp(amount, uint128(_getUnattributed()));
        if (withdrawable > 0) {
            if (transferOut) {
                _withdrawTokenTo(to, uint96(withdrawable));
            } else {
                _addToWithdrawable(to, uint96(withdrawable));
            }
        }
    }
    /**
     * transfer an amount of tokens currently attributed to the withdrawable balance of the sender
     * @param to the to of the funds
     * @param amount the amount that should be deducted from the sender's balance
     */
    function withdrawTokenTo(address to, uint96 amount) external payable {
        _withdrawTokenTo(to, uint96(_deductWithdrawable(msg.sender, amount)));
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
        uint96 stakerConfig, address staker,
        uint96 delta, uint160 stakeId,
        uint256 settings,
        IStakeable.StakeStore memory stake
    ) internal returns(uint256) {
        uint96 d = uint96(delta);
        uint8 tipMethod = uint8(settings << 0 >> (256 - 8));
        if (tipMethod > 0) {
            uint256 tip = _computeMagnitude(
                tipMethod, uint64(settings << 8 >> (256 - 6)), d,
                stake
            );
            // because we do not set a var for you to collect unattributed tokens
            // it must be done at the end
            d -= uint96(tip > d ? d : tip);
        }
        uint96 toWithdraw;
        uint64 withdrawableMethod = uint8(settings << 72 >> (256 - 8));
        if (withdrawableMethod > 0) {
            toWithdraw = uint96(_computeMagnitude(
              withdrawableMethod, uint64(settings << 80 >> (256 - 6)), d,
              stake
            ));
            // we have to keep this delta outside of the unchecked block
            // in case someone sets a magnitude that is too high
            d -= uint96(toWithdraw > d ? d : toWithdraw); // checks for underflow
            _withdrawTokenTo(staker, toWithdraw);
        }
        uint64 newStakeMethod = uint8(settings << 144 >> (256 - 8));
        if (newStakeMethod > 0) {
            uint96 endStakeAmount = uint96(_computeMagnitude(
              newStakeMethod, uint64(settings << 152 >> (256 - 6)), d,
              stake
            ));
            uint16 newStakeDays = uint16(_computeMagnitude(
              uint8(settings << 216 >> (256 - 8)), uint64(settings << 232 >> (256 - 1)), stake.stakedDays,
              stake
            ));
            d -= uint96(endStakeAmount > d ? d : endStakeAmount); // checks for underflow
            uint256 nextStakeId = _stakeStartFor(
                stakerConfig, staker,
                endStakeAmount, newStakeDays
            );
            uint8 copyIterations = uint8(settings << 240 >> (256 - 8));
            if (copyIterations > 1) {
                copyIterations = copyIterations - 1;
                // settings will be maintained for the new stake
                _logSettingsUpdate(nextStakeId, settings);
            }
        }
        if (d > 0) {
            _addToWithdrawable(staker, d);
        }
        // this data should still be available in logs
        delete stakeIdToSettings[stakeId];
        return delta;
    }
    /**
     * signal to enders that early ending is or is not allowed
     * @param staker the staker that gave consent to early end stake
     * @param stakeId the stake id in question
     * @param state the state to change the allow early end to
     */
    function _consentEarlyEnd(
        address staker,
        uint88 stakeId,
        bool state
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
    function consentEarlyEnd(uint248 stakeId, bool state) external payable {
        _consentEarlyEnd(msg.sender, uint88(stakeId), state);
    }
    /**
     * @notice this is a globally shared pool of nonces - all methods draw from this pool
     */
    mapping(address => mapping(uint256 => bool)) public signerToNonceConsumed;
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
        if (signer != address(0)) {
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
     * @param stakeIndex the index where the corresponding stake id resides
     * @param skipIdMismatch skip the end staking process if the id provided
     * @param earliestDay the earliest day that the stake can be ended
     * @param stakeId the stake id in question
     * @param nonce a nonce associated with the signature - used to cancel out signatures
     * @param signature the signature proving consent to end the stake
     * does not match the one at the index
     * @notice if the earliest day does not match the signature
     * or that day has not been reached then the method will fail
     */
    function stakeEndBySignature(
        uint8 stakerConfig, address staker, uint48 stakeIndex, uint40 stakeId,
        bool skipIdMismatch, uint16 earliestDay, uint232 nonce,
        bytes calldata signature
    ) external payable returns(uint256) {
        address custodian = stakerConfig == uint256(0) ? isolatedStakeManagers[staker] : address(this);
        IStakeable.StakeStore memory stake = _getStake(custodian, uint96(stakeIndex));
        if (stake.stakeId != stakeId && skipIdMismatch) {
            return 0;
        }
        uint256 currentDay = _currentDay();
        if (currentDay < earliestDay) {
            revert StakeNotEnded(uint96(earliestDay), uint160(currentDay));
        }
        bytes32 hashedInput = keccak256(abi.encode(
            keccak256("ConsentEarlyEnd(uint16 earliestDay,uint40 stakeId,uint200 nonce)"),
            earliestDay,
            stakeId,
            uint200(nonce)
        ));
        address signer = _verifySignature(hashedInput, nonce, signature);
        _verifyEndableStakeOwnership(signer, stakeId);
        return _stakeEndByConsent(
            stakerConfig, staker, stakeIndex, stakeId,
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
        uint40 stakeId, uint216 nonce,
        Settings calldata settings,
        bytes calldata signature
    ) external payable {
        bytes32 hashedInput = keccak256(abi.encode(
            keccak256("ConsentUpdateSettings(uint40 stakeId,uint216 nonce,(uint8,uint64,uint8,uint64,uint8,uint64,uint16,uint8,uint16) settings)"),
            stakeId,
            nonce,
            settings
        ));
        address signer = _verifySignature(hashedInput, nonce, signature);
        _verifyEndableStakeOwnership(signer, stakeId);
        return _logSettingsUpdate(stakeId, _encodeSettings(settings));
    }
    function withdrawTokenToBySignature(
        address to, uint96 amount,
        uint256 nonce,
        bytes calldata signature
    ) external payable {
        bytes32 hashedInput = keccak256(abi.encode(
            keccak256("ConsentWithdrawTokenTo(address to,uint96 amount,uint256 nonce)"),
            to,
            amount,
            nonce
        ));
        address signer = _verifySignature(hashedInput, nonce, signature);
        _withdrawTokenTo(to, uint96(_deductWithdrawable(signer, amount)));
    }
}
