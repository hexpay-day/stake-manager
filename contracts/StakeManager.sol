// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IStakeable.sol";
import "./IUnderlyingStakeable.sol";

contract StakeManager {
    using SafeERC20 for IERC20;

    struct Settings {
        // 1 word;
        uint8 tipMethod;
        uint104 tipMagnitude;
        // used as a percentage
        uint8 withdrawableMethod;
        uint104 withdrawableMagnitude;
        // the rest goes into a new stake if the number of days are set
        uint16 newStakeDays;
        uint16 copySettings; // doesn't need 16bits, but better to have 256 total
    }
    /**
     * an event to signal that settings to direct funds
     * at the end of a stake have been updated
     * @param stakeId the stake id that was updated
     * @param settings the newly updated settings
     */
    event UpdatedSettings(uint256 indexed stakeId, Settings indexed settings);
    /**
     * signals to enders that the early end state has changed
     * @param stakeId the stake id whos allow early end state has changed
     * @notice the state of the early end is not stored in the log
     * this is because, generally, early ending should only go one way
     * allowing, then disallowing early ending may cause enders to ignore stakes
     */
    event UpdateConsentEarlyEnd(uint256 indexed stakeId);
    /**
     * @notice this event is thrown when the stake id provided
     * does not match what is expected given other contextual information
     * such as an index
     */
    error StakeIdMismatch(uint128 provided, uint128 expected);
    /**
     * @notice this error is thrown when the stake in question
     * is not owned by the expected address
     */
    error StakeNotOwned(address provided, address expected);
    /**
     * @notice this error is thrown when the stake being ended is not yet ended
     */
    error StakeNotEndable(uint128 provided, uint128 expected);
    /**
     * @notice error is thrown when there is not enough funding to do the required operation
     */
    error NotEnoughFunding(uint128 provided, uint128 expected);

    /**
     * @notice this var is re-defined here to keep the computeMagnitude method pure
     * at the cost of one extra byteword during deployment
     */
    uint256 public constant percentMagnitudeLimit = 1_000_000_000_000_000;
    /**
     * @notice the underlying, target contract to interact with
     */
    address public immutable target;
    /**
     * @notice a global denoting the number of tokens attributed to addresses
     * @dev this value provides a useful "before" value whenever tokens are moving
     */
    uint256 public tokensAttributed;
    /**
     * @notice the owner of a stake indexed by the stake id
     */
    mapping(uint256 => address) public stakeIdToOwner;
    /**
     * @notice the owner of this stake has given consent for this stake to be ended early
     */
    mapping(uint256 => bool) public stakeIdConsentEarlyEnd;
    /**
     * @notice settings of stakes indexed by the stake id
     */
    mapping(uint256 => Settings) public stakeIdToSettings;
    /**
     * @notice an invariant that tracks how much underlying token is owned by a particular address
     */
    mapping(address => uint256) public withdrawableBalanceOf;
    /**
     * creates the internal stake ender contract
     * @param targetAddress the targeted contract of the underlying asset
     */
    constructor(address targetAddress) {
        target = targetAddress;
    }
    function _addToWithdrawable(address staker, uint96 amount) internal {
        // the reason we can do unchecked here is because we do not have to
        unchecked {
            withdrawableBalanceOf[staker] += amount;
            tokensAttributed += amount;
        }
    }
    /**
     * deduce an amount from the provided account
     * @param account the account to deduct funds from
     * @param amount the amount of funds to deduct
     */
    function _deductWithdrawable(address account, uint96 amount) internal returns(uint256) {
        uint256 withdrawable = withdrawableBalanceOf[account];
        if (amount == 0) {
            amount = uint96(withdrawable);
        }
        if (withdrawable < amount) {
            revert NotEnoughFunding(uint128(withdrawable), amount);
        }
        withdrawableBalanceOf[account] = withdrawable - amount;
        unchecked {
            tokensAttributed -= amount;
        }
        return amount;
    }
    /** checks the current day on the provided target */
    function _currentDay(address targetAddress) internal view returns(uint256) {
        return IStakeable(targetAddress).currentDay();
    }
    function _stakeDateIsEndable(
        uint216 stakeIndex,
        uint40 stakeId
    ) internal view returns(bool) {
        address _target = target;
        IStakeable.StakeStore memory stake = _getStake(_target, uint96(stakeIndex));
        if (stake.stakeId != stakeId) {
            revert StakeIdMismatch(stake.stakeId, uint128(stakeId));
        }
        return (stake.lockedDay + stake.stakedDays) <= _currentDay(_target);
    }
    function _getUnattributed() view internal returns(uint256) {
        return IERC20(target).balanceOf(address(this)) - tokensAttributed;
    }
    /** deposits tokens from a staker and marks them for that staker */
    function _depositTokenFrom(address staker, uint96 amount) internal {
        IERC20(target).transferFrom(staker, address(this), amount);
    }
    /** transfers a token to a recipient */
    function _withdrawTokenTo(address to, uint96 amount) internal {
        IERC20(target).transfer(to, amount);
    }
    /**
     * start a stake for the staker given the amount and number of days
     * @param staker the staker to start a stake for
     * @param amount the amount to add to the stake
     * @param newStakedDays the number of days that the stake should run
     */
    function _stakeStartFor(
        address staker,
        uint256 amount,
        uint256 newStakedDays
    ) internal returns(uint256) {
        // get future index of stake
        address _target = target;
        uint256 index = IUnderlyingStakeable(_target).stakeCount(address(this));
        // start the stake
        IERC20(_target).approve(_target, amount);
        IStakeable(_target).stakeStart(amount, newStakedDays);
        // get the stake id
        IStakeable.StakeStore memory stake = _getStake(_target, uint96(index));
        // attribute stake to the staker
        stakeIdToOwner[stake.stakeId] = staker;
        return stake.stakeId;
    }
    /**
     * gets the stake store at the provided index
     * @param targetAddress the contract to target
     * @param index the index of the stake to get
     */
    function _getStake(address targetAddress, uint96 index) internal view returns(IStakeable.StakeStore memory) {
    return IStakeable(targetAddress).stakeLists(address(this), index);
    }
    /**
     * ends a stake for someone else
     * @param stakeIndex the stake index on the underlying contract to end
     * @param stakeId the stake id on the underlying contract to end
     */
    function _stakeEnder(
        uint216 stakeIndex,
        uint40 stakeId
    ) internal returns(uint96 delta) {
        // calculate the balance before
        address _target = target;
        // cannot use tokens attributed here because of tipping
        uint256 balanceBefore = IERC20(_target).balanceOf(address(this));
        // end the stake - attributed to contract
        IStakeable(_target).stakeEnd(stakeIndex, stakeId);
        // because the delta is only available in the logs
        // we need to calculate the delta to use it
        delta = uint96(IERC20(_target).balanceOf(address(this)) - balanceBefore);
        // directs funds from the end stake to their final resting place
        _directFunds(stakeId, delta);
    }
    /**
     * compute a useful value from 2 inputs
     * @param method the method to use to compute a result
     * @param y a primary magnitude to use - a constant function
     * @param x a secondary magnitude to use - generally the amount of the end stake
     */
    function _computeMagnitude(
        uint8 method,
        uint104 x,
        uint144 y
    ) internal pure returns(uint256 tip) {
        if (method == 0) {
            return 0;
        } else if (method == 1) {
            return y;
        } else if (method == 2) {
            return x;
        } else if (method == 3) {
            return (uint256(x) * y) / 1_000_000_000_000_000;
        }
    }
    /**
     * update the settings for a stake id
     * @param stakeId the stake id to update settings for
     * @param settings an object that holds settings values
     * to inform end stakers how to handle the stake
     */
    function _logSettingsUpdate(
        uint256 stakeId,
        Settings memory settings
    ) internal {
        stakeIdToSettings[stakeId] = settings;
        emit UpdatedSettings(stakeId, settings);
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
        uint96 stakeId,
        uint160 delta
    ) internal {
        Settings memory settings = stakeIdToSettings[stakeId];
        uint144 d = uint144(delta);
        uint256 tip = _computeMagnitude(settings.tipMethod, settings.tipMagnitude, d);
        if (tip > 0) {
            // because we do not set a var for you to collect unattributed tokens
            // it must be done at the end
            d -= uint144(tip);
        }
        address staker = stakeIdToOwner[stakeId];
        if (settings.withdrawableMethod > 0) {
            uint96 toWithdraw = uint96(_computeMagnitude(settings.withdrawableMethod, settings.withdrawableMagnitude, d));
            // we have to keep this delta outside of the unchecked block
            // in case someone sets a magnitude that is too high
            d -= toWithdraw;
            _addToWithdrawable(staker, toWithdraw);
        }
        if (settings.newStakeDays > 0) {
            uint256 nextStakeId = _stakeStartFor(staker, d, settings.newStakeDays);
            if (settings.copySettings == 1) {
                // settings will be maintained for the new stake
                _logSettingsUpdate(nextStakeId, settings);
            }
        }
        if (d > 0) {
            _withdrawTokenTo(stakeIdToOwner[stakeId], uint96(d));
        }
        // this data should still be available in logs
        delete stakeIdToOwner[stakeId];
        delete stakeIdToSettings[stakeId];
    }
    /**
     * checks that the stake in the index matches the stake id
     * @param stakeIndex the stake index of the stake
     * @param stakeId the stake id expected
     * @dev use this method to bail out of your transaction
     * for example, if you are ending 3 stakes, and 1 of them is ended by someone else
     */
    function checkStakeEnded(uint216 stakeIndex, uint40 stakeId) external view {
        IStakeable.StakeStore memory stake = _getStake(target, uint96(stakeIndex));
        if (stake.stakeId != stakeId) {
            revert StakeIdMismatch(stake.stakeId, stakeId);
        }
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
     */
    function depositTokenDangerous(uint256 amount) external payable {
        _depositTokenFrom(msg.sender, uint96(amount));
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
     * updates settings under a stake id to the provided settings struct
     * @param stakeId the stake id to update
     * @param settings the settings to update the stake id to
     */
    function updateSettings(uint256 stakeId, Settings calldata settings) external payable {
        if (stakeIdToOwner[stakeId] != msg.sender) {
            revert StakeNotOwned(msg.sender, stakeIdToOwner[stakeId]);
        }
        _logSettingsUpdate(uint96(stakeId), settings);
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
    function clamp(uint128 amount, uint128 max) external pure returns(uint256) {
        return _clamp(amount, max);
    }
    function _clamp(uint128 amount, uint128 max) internal pure returns(uint256) {
        if (amount == 0) {
            return max;
        }
        return amount > max ? max : amount;
    }
    /**
     * collect unattributed tokens and send to recipient of choice
     * @notice when 0 is passed, withdraw maximum available
     * or in other words, all unattributed tokens
     */
    function collectUnattributed(
        address to,
        uint88 amount,
        bool transferOut
    ) external payable {
        uint256 max = _getUnattributed();
        uint256 withdrawable = _clamp(amount, uint128(max));
        if (withdrawable > 0) {
            if (transferOut) {
                _withdrawTokenTo(to, uint96(withdrawable));
            } else {
                _addToWithdrawable(to, uint96(withdrawable));
            }
        }
    }
    /**
     * computes a magnitude from the provided values
     * @param stakeId the stake id to get settings for
     * @param y the value to supply as a secondary magnitude
     */
    function computeEnderTip(uint112 stakeId, uint144 y) external view returns(uint256) {
        Settings memory settings = stakeIdToSettings[stakeId];
        return _computeMagnitude(settings.tipMethod, settings.tipMagnitude, y);
    }
    /**
     * compute a magnitude given an x and y
     * @param method the method to use to compute the result
     * @param x the first value as input
     * @param y the second value as input
     */
    function computeMagnitude(
        uint8 method,
        uint104 x,
        uint144 y
    ) external pure returns(uint256) {
        return _computeMagnitude(method, x, y);
    }
    /**
     * end a stake for someone other than the sender of the transaction
     * @param stakeIndex the stake index on the underlying contract to end
     * @param stakeId the stake id on the underlying contract to end
     * @param skipEnded skips the end stake if the stake has already been ended
     */
    function stakeEnder(
        uint208 stakeIndex,
        uint40 stakeId,
        bool skipEnded
    ) external payable {
        if (_isStakeEndable(stakeIndex, stakeId, skipEnded)) {
            _stakeEnder(stakeIndex, stakeId);
        }
    }
    function isStakeEndable(
        uint208 stakeIndex,
        uint40 stakeId,
        bool skipEnded
    ) external view returns(bool) {
        return _isStakeEndable(stakeIndex, stakeId, skipEnded);
    }
    function _isStakeEndable(
        uint208 stakeIndex,
        uint40 stakeId,
        bool skipEnded
    ) internal view returns(bool) {
        if (!_stakeDateIsEndable(stakeIndex, stakeId)) {
            if (skipEnded) {
                return false;
            }
            if (!stakeIdConsentEarlyEnd[stakeId]) {
                address _target = target;
                IStakeable.StakeStore memory stake = _getStake(_target, uint96(stakeIndex));
                revert StakeNotEndable(uint128(_currentDay(_target)), stake.lockedDay + stake.stakedDays);
            }
        }
        return true;
    }
    function stakeEnderMany(bytes32[] calldata stakeEnds) external payable {
        uint256 i;
        uint256 len = stakeEnds.length;
        do {
            bytes32 stakeEnd = stakeEnds[i];
            uint216 stakeIndex = uint216(uint256(stakeEnd) >> 40);
            uint40 stakeId = uint40(uint256(stakeEnd));
            if (_isStakeEndable(uint208(stakeIndex), stakeId, true)) {
                _stakeEnder(stakeIndex, stakeId);
            }
            ++i;
        } while(i < len);
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
}
