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
    authorization[runner] = settings;
    emit UpdateAuthorized(runner, settings);
  }
  enum Capability {
    START,
    END,
    EARLY_END
  }
  function isCapable(uint256 setting, Capability target) internal pure returns(bool) {
    if (target == Capability.START) {
      return setting == 1 || setting == 3 || setting == 5 || setting > 6;
    } else if (target == Capability.END) {
      return setting == 2 || setting == 3 || setting > 5;
    } else {
      // early end
      return setting > 3;
    }
  }
  function isEarlyEnding(StakeStore memory stake, uint256 currentDay) internal pure returns(bool) {
    return (stake.lockedDay + stake.stakedDays) < currentDay;
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
    if (!isCapable(settings, Capability.START)) {
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
    uint256 setting = authorization[msg.sender];
    StakeStore memory stake = _getStake(address(this), stakeIndex);
    if (isEarlyEnding(stake, _currentDay())) {
      if (!isCapable(setting, Capability.EARLY_END)) {
        revert NotAllowed();
      }
    } else {
      if (!isCapable(setting, Capability.END)) {
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
