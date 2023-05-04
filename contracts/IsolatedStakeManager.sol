// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Stakeable.sol";
import "./IStakeable.sol";

contract IsolatedStakeManager is Stakeable {
  mapping(address => bool) public authorized;
  constructor(address owner) {
    authorized[msg.sender] = true;
    authorized[owner] = true;
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
    uint256 amount = newStakedHearts == 0 ? IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).balanceOf(address(this)) : newStakedHearts;
    IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).transferFrom(msg.sender, address(this), amount);
    IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).stakeStart(amount, newStakedDays);
  }
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    if (!authorized[msg.sender]) {
      revert NotAllowed();
    }
    IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).stakeEnd(stakeIndex, stakeId);
    IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).transfer(
      msg.sender,
      IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).balanceOf(address(this))
    );
  }
}
