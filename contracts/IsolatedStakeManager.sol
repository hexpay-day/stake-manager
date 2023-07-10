// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./AuthorizationManager.sol";
import "./Stakeable.sol";

contract IsolatedStakeManager is Stakeable, Ownable2Step, AuthorizationManager {
  constructor(address owner) AuthorizationManager(31) {
    /*
     * by index:
     * 0: can start stakes
     * 1: can end stakes
     * 2: can early end stakes
     * 3: can transfer balance to owner
     * 4: can transfer from owner
     */
    _setAddressAuthorization(owner, MAX_AUTHORIZATION);
    _transferOwnership(owner);
  }
  /**
   * set authorization flags for a provided target
   * @param target the address to change settings for
   * @param setting the encoded setting (binary) to apply to the target address
   */
  function setAuthorization(address target, uint256 setting) external onlyOwner {
    _setAddressAuthorization(target, setting);
  }
  /**
   * allow addresses to start stakes from tokens already in the contract
   * @param runner the anticipated address(es) that will be running the following method
   * @param stakeDays the number of days that can be passed for the address (to constrain griefing)
   * @param setting the settings to provide (only index 0 is relevant)
   */
  function setStartAuthorization(address runner, uint16 stakeDays, uint256 setting) external onlyOwner {
    _setAuthorization(_startAuthorizationKey(runner, stakeDays), setting);
  }
  /**
   * gets the start authorization key given a runner and stake days
   * @param runner the anticipated address(es) that will be running the following method
   * @param stakeDays the number of days that can be passed for the address (to constrain griefing)
   */
  function startAuthorizationKey(address runner, uint256 stakeDays) external pure returns(bytes32) {
    return _startAuthorizationKey(runner, stakeDays);
  }
  /**
   * stake a given amount of tokens for a given number of days
   * @param newStakedHearts the number of hearts to stake
   * @param newStakedDays the number of days to stake said hearts
   * @notice if 0 is provided then the balance of the contract will be utilized
   * this should generally only be used if tokens are sent to the contract
   * and end stakes are not occuring for a number of days
   * @notice if you do not have global start abilities, but do have scoped abilities
   * it is not rational to pass anything but zero for this method
   */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external override {
    uint256 setting = _getAddressSetting(msg.sender);
    // blanket start authorization
    if (!_isCapable(setting, 0)) {
      revert NotAllowed();
    }
    if (newStakedHearts > 0) {
      _transferFromOwner(newStakedHearts);
    }
    _stakeStart(newStakedDays);
  }
  /**
   * start a stakes, so long as sender has the authorization to do so from owner
   * @param newStakedDays the number of days to start a stake
   */
  function stakeStartWithAuthorization(uint256 newStakedDays) external {
    // scoped authorization - to keep non-permitted contracts from griefing users
    if (!_isCapable(authorization[_startAuthorizationKey(msg.sender, newStakedDays)], 0)) {
      revert NotAllowed();
    }
    _stakeStart(newStakedDays);
  }
  /**
   * transfer a number of hearts from the owner into the contract
   * @param newStakedHearts number of hearts to deposit into contract
   * @notice authorization occurs inside of the internal method
   */
  function transferFromOwner(uint256 newStakedHearts) external {
    _transferFromOwner(newStakedHearts);
  }
  /**
   * ends the stake on the underlying target contract (HEX)
   * and transfers tokens to the owner
   * @param stakeIndex the index of the stake in ownership list
   * @param stakeId the id held on the stake
   * @notice this method fails if the stake at the provided index does not match the stakeId
   */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (!_settingsCheck(stake)) {
      revert NotAllowed();
    }
    _endStake(stakeIndex, stakeId);
  }
  /**
   * transfers tokens to the owner of the contract
   */
  function transferToOwner() external payable {
    _transferToOwner();
  }
  /**
   * ends the stake on the underlying target contract (HEX)
   * and transfers tokens to the owner
   * @param stakeIndex the index of the stake in ownership list
   * @param stakeId the id held on the stake
   * @notice this method does not fail if the stake at the
   * provided index does not have the provided stake id
   * @notice this method does not fail if authorization
   * is not provided to the runner of this method
   * this is to give every opportunity for strangers (who are authorized)
   * to end stakes without risk of losing too much gas money
   */
  function checkAndStakeEnd(uint256 stakeIndex, uint40 stakeId) external {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (stake.stakeId != stakeId || !_settingsCheck(stake)) {
      return;
    }
    _endStake(stakeIndex, stakeId);
  }
  /**
   * ends a stake on the underlying contract
   * @param stakeIndex stake index to end
   * @param stakeId stake id to end
   * @notice this will fail on the underlying if
   * the stakeIndex and stakeId does not match
   */
  function _endStake(uint256 stakeIndex, uint40 stakeId) internal {
    IStakeable(target).stakeEnd(stakeIndex, stakeId);
  }
  /**
   * transfer balance to the owner of this contract
   */
  function _transferToOwner() internal {
    if (!_isCapable(_getAddressSetting(msg.sender), 3)) {
      revert NotAllowed();
    }
    IERC20(target).transfer(owner(), _getBalance(address(this)));
  }
  /**
   * check the settings of the running address
   * @param stake the stake to check authorization over
   */
  function _settingsCheck(StakeStore memory stake) internal view returns(bool) {
    uint256 setting = _getAddressSetting(msg.sender);
    if (_isEarlyEnding(stake, _currentDay())) {
      // can early end stake
      return _isCapable(setting, 2);
    } else {
      // can end stake
      return _isCapable(setting, 1);
    }
  }
  /**
   * get the start authorization key for an address and number of stake days
   * @param runner the address that will run the method
   * @param stakeDays the number of days to stake
   */
  function _startAuthorizationKey(address runner, uint256 stakeDays) internal pure returns(bytes32) {
    return bytes32(uint256(uint160(runner)) << 16 | uint16(stakeDays));
  }
  /**
   * starts a stake on the underlying contract for a given number of days
   * @param newStakedDays a number of days to start a stake for
   */
  function _stakeStart(uint256 newStakedDays) internal {
    uint256 stakedHearts = _getBalance(address(this));
    if (stakedHearts > 0) {
      IStakeable(target).stakeStart(stakedHearts, newStakedDays);
    }
  }
  /**
   * transfer a number of hearts from the owner to this contract
   * @param amount number of hearts to transfer from owner
   */
  function _transferFromOwner(uint256 amount) internal {
    if (!_isCapable(_getAddressSetting(msg.sender), 4)) {
      revert NotAllowed();
    }
    IERC20(target).transferFrom(owner(), address(this), amount);
  }
}
