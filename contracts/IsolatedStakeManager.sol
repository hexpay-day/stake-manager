// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "./Stakeable.sol";
import "./IStakeable.sol";

contract IsolatedStakeManager is Stakeable, Ownable2Step {
  mapping(address => uint256) public authorization;
  event UpdateAuthorized(address runner, uint256 startAuthorization);
  constructor(address owner) {
    authorization[owner] = 7; // can start, end, and early end stakes
    _transferOwnership(owner);
  }
  /**
   * set the authorization status of an address
   * @param runner the address to set the authorization flag of
   * @param settings allowed to start / end / early end stakes
   */
  function setAuthorized(address runner, uint256 settings) external onlyOwner {
    if (settings > 7) {
      revert NotAllowed();
    }
    authorization[runner] = settings;
    emit UpdateAuthorized(runner, settings);
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
    uint256 settings = authorization[msg.sender];
    if (!checkBinary(settings, 0)) {
      revert NotAllowed();
    }
    address tokenHolder = owner();
    uint256 amount = newStakedHearts == 0
      ? IERC20(target).balanceOf(tokenHolder)
      : newStakedHearts;
    IERC20(target).transferFrom(tokenHolder, address(this), amount);
    IStakeable(target).stakeStart(amount, newStakedDays);
  }
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    _endStake(stake, stakeIndex, stakeId);
  }
  function checkAndStakeEnd(uint256 stakeIndex, uint40 stakeId) external {
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (stake.stakeId != stakeId) {
      return;
    }
    _endStake(stake, stakeIndex, stakeId);
  }
  function _endStake(StakeStore memory stake, uint256 stakeIndex, uint40 stakeId) internal {
    uint256 setting = authorization[msg.sender];
    if (isEarlyEnding(stake, _currentDay())) {
      // can early end stake
      if (!checkBinary(setting, 2)) {
        revert NotAllowed();
      }
    } else {
      // can end stake
      if (!checkBinary(setting, 1)) {
        revert NotAllowed();
      }
    }
    IStakeable(target).stakeEnd(stakeIndex, stakeId);
    IERC20(target).transfer(
      owner(),
      IERC20(target).balanceOf(address(this))
    );
  }
}

contract IsolatedStakeManagerFactory {
  /**
   * @notice a mapping of a key that contains a modifier and the owning address
   * pointing to the address of the contract created by the stake manager
   */
  mapping(address => address) public isolatedStakeManagers;
  function upsertManager(address staker) external returns(address existing) {
    existing = isolatedStakeManagers[staker];
    if (existing != address(0)) {
      return existing;
    }
    // this scopes up to 2 stake managers to a single address
    // one that can only be ended by the staker one that can be ended by the stake manager
    existing = address(new IsolatedStakeManager{salt: keccak256(abi.encode(staker))}(staker));
    isolatedStakeManagers[staker] = existing;
  }
}
