// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Multicall.sol";
import "./IStakeable.sol";
import "./StakeManager.sol";

contract StakeEnder is IStakeable, Multicall, StakeManager {
    constructor(address _target) StakeManager(_target) {}
    /**
     * starts a stake from the provided amount
     * @param amount amount of tokens to stake
     * @param newStakedDays the number of days for this new stake
     * @notice because the balance of this contract is shared by many people
     * we cannot put the scoped decrement in the unchecked block
     * otherwise alice could spend bob's tokens
     */
    function stakeStart(uint256 amount, uint256 newStakedDays) external {
        address staker = msg.sender;
        _deductWithdrawable(staker, uint96(amount));
        _stakeStartFor(staker, amount, newStakedDays);
    }
    /**
     * end your own stake and skips tip computing
     * @param stakeIndex the index on the underlying contract to end stake
     * @param stakeId the stake id from the underlying contract to end stake
     * @notice this is not payable to match the underlying contract
     */
    function stakeEnd(uint256 stakeIndex, uint40 stakeId) external {
        _stakeEndFor(msg.sender, uint56(stakeIndex), stakeId);
    }
    /**
     * gets stake store for a provided staker and index
     * @param staker the staker to check the stake list of
     * @param index the index of the array to check
     * @dev this is only available as a means of continuity for interfaces
     */
    function stakeLists(address staker, uint256 index) external view returns(IStakeable.StakeStore memory) {
        return IStakeable(target).stakeLists(staker, index);
    }
    /**
     * checks the current day on the target contract
     */
    function currentDay() external view returns(uint256) {
        return _currentDay(target);
    }
}
