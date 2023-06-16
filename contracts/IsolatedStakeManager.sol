// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./AuthorizationManager.sol";
import "./Stakeable.sol";

contract IsolatedStakeManager is Stakeable, Ownable2Step, AuthorizationManager {
  constructor(address owner) AuthorizationManager(7) {
    // can start, end, and early end stakes
    _setAddressAuthorization(owner, MAX_AUTHORIZATION);
    _transferOwnership(owner);
  }
  function setAuthorization(address target, uint256 setting) external onlyOwner {
    _setAddressAuthorization(target, setting);
  }
  /**
   * stake a given amount of tokens for a given number of days
   * @param newStakedHearts the number of hearts to stake
   * @param newStakedDays the number of days to stake said hearts
   * @notice if 0 is provided then the balance of the contract will be utilized
   * this should generally only be used if tokens are sent to the contract
   * and end stakes are not occuring for a number of days
   */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) external override {
    uint256 setting = authorization[bytes32(uint256(uint160(msg.sender)))];
    if (!checkBinary(setting, 0)) {
      revert NotAllowed();
    }
    address tokenHolder = owner();
    uint256 amount = newStakedHearts == 0
      ? IERC20(target).balanceOf(tokenHolder)
      : newStakedHearts;
    IERC20(target).transferFrom(tokenHolder, address(this), amount);
    Stakeable(target).stakeStart(amount, newStakedDays);
  }
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (!_settingsCheck(stake)) {
      revert NotAllowed();
    }
    _endStake(stakeIndex, stakeId);
  }
  function checkAndStakeEnd(uint256 stakeIndex, uint40 stakeId) external {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (stake.stakeId != stakeId || !_settingsCheck(stake)) {
      return;
    }
    _endStake(stakeIndex, stakeId);
  }
  function _endStake(uint256 stakeIndex, uint40 stakeId) internal {
    Stakeable(target).stakeEnd(stakeIndex, stakeId);
    IERC20(target).transfer(
      owner(),
      IERC20(target).balanceOf(address(this))
    );
  }
  function _settingsCheck(StakeStore memory stake) internal view returns(bool) {
    uint256 setting = authorization[bytes32(uint256(uint160(msg.sender)))];
    if (isEarlyEnding(stake, _currentDay())) {
      // can early end stake
      return checkBinary(setting, 2);
    } else {
      // can end stake
      return checkBinary(setting, 1);
    }
  }
}
