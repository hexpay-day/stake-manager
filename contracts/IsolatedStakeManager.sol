// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Stakeable.sol";
import "./IStakeable.sol";

contract IsolatedStakeManager is Stakeable, Ownable {
  mapping(address => bool) public authorized;
  event UpdateAuthorized(address runner, bool value);
  constructor(address owner) {
    authorized[msg.sender] = true;
    authorized[owner] = true;
    _transferOwnership(owner);
  }
  /**
   * set the authorization status of an address
   * @param runner the address to set the authorization flag of
   * @param value false to disallow end stakes
   */
  function setAuthorized(address runner, bool value) external onlyOwner {
    authorized[runner] = value;
    emit UpdateAuthorized(runner, value);
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
    if (!authorized[msg.sender]) {
      revert NotAllowed();
    }
    uint256 amount = newStakedHearts == 0
      ? IERC20(target).balanceOf(address(this))
      : newStakedHearts;
    IERC20(target).transferFrom(msg.sender, address(this), amount);
    IStakeable(target).stakeStart(amount, newStakedDays);
  }
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    if (!authorized[msg.sender]) {
      revert NotAllowed();
    }
    IStakeable(target).stakeEnd(stakeIndex, stakeId);
    IERC20(target).transfer(
      msg.sender,
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
  function create() external returns(address existing) {
    address staker = msg.sender;
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
