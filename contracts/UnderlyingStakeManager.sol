// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IsolatedStakeManager.sol";
import "./IUnderlyingStakeable.sol";
import "./UnderlyingStakeable.sol";
import "./IsolatedStakeManager.sol";
import "./Stakeable.sol";
import "./IStakeable.sol";

contract UnderlyingStakeManager is Stakeable {
  /**
   * signals to enders that the early end state has changed
   * @param stakeId the stake id whos allow early end state has changed
   * @notice the state of the early end is not stored in the log
   * this is because, generally, early ending should only go one way
   * allowing, then disallowing early ending may cause enders to ignore stakes
   */
  event UpdateConsentEarlyEnd(uint256 indexed stakeId);
  /**
   * @notice this error is thrown when the stake being ended is not yet ended
   */
  error StakeNotEndable(uint256 provided, uint256 expected);
  /**
   * @notice the owner of a stake indexed by the stake id
   */
  mapping(uint256 => address) public stakeIdToOwner;
  /**
   * @notice the owner of this stake has given consent for this stake to be ended early
   */
  mapping(uint256 => bool) public stakeIdConsentEarlyEnd;
  mapping(uint256 => uint256) public stakeIdToIndex;
  /**
   * creates the internal stake ender contract
   */
  constructor() {}
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address staker, uint256 amount) internal {
    IERC20(target).transferFrom(staker, address(this), amount);
  }
  /**
   * deposit a number of tokens to the contract
   * @param amount the number of tokens to deposit
   */
  function depositTokenUnattributed(uint256 amount) external {
    _depositTokenFrom(msg.sender, amount);
  }
  /**
   * transfers tokens to a recipient
   * @param to where to send the tokens
   * @param amount the number of tokens to send
   */
  function _withdrawTokenTo(address to, uint256 amount) internal {
    IERC20(target).transfer(to, amount);
  }
  /**
   * start a stake for the staker given the amount and number of days
   * @param staker the underlying owner of the stake
   * @param amount the amount to add to the stake
   * @param newStakedDays the number of days that the stake should run
   */
  function _stakeStartFor(
    address staker,
    uint256 amount, uint256 newStakedDays
  ) internal returns(uint256 stakeId) {
    // get future index of stake
    uint256 index = IUnderlyingStakeable(target).stakeCount(address(this));
    IStakeable(target).stakeStart(amount, newStakedDays);
    // get the stake id
    stakeId = IStakeable(target).stakeLists(address(this), index).stakeId;
    stakeIdToIndex[stakeId] = index;
    // attribute stake to the staker
    stakeIdToOwner[stakeId] = staker;
  }
  /**
   * ends a stake for someone else
   * @param stakeIndex the stake index on the underlying contract to end
   * @param stakeId the stake id on the underlying contract to end
   */
  function _stakeEnd(
    uint256 stakeIndex, uint256 stakeId
  ) internal returns(uint256 delta) {
    // calculate the balance before
    // cannot use tokens attributed here because of tipping
    uint256 balanceBefore = IERC20(target).balanceOf(address(this));
    address custodian = target;
    // end the stake - attributed to contract or through the managed stake
    IStakeable(custodian).stakeEnd(stakeIndex, uint40(stakeId));
    delete stakeIdToIndex[stakeId];
    if (IUnderlyingStakeable(target).stakeCount(address(this)) > stakeIndex) {
      stakeIdToIndex[_getStake(address(this), stakeIndex).stakeId] = stakeIndex;
    }
    // because the delta is only available in the logs
    // we need to calculate the delta to use it
    unchecked {
      delta = IERC20(target).balanceOf(address(this)) - balanceBefore;
    }
    delete stakeIdToOwner[stakeId];
  }
  /**
   * starts a stake from the provided amount
   * @param amount amount of tokens to stake
   * @param newStakedDays the number of days for this new stake
   * @dev this method interface matches the original underlying token contract
   */
  function stakeStart(uint256 amount, uint256 newStakedDays) external override {
    // ensures amount under/from sender is sufficient
    _depositTokenFrom(msg.sender, amount);
    _stakeStartFor(
      msg.sender,
      amount, newStakedDays
    );
  }
  /**
   * end your own stake which is custodied by the stake manager. skips tip computing
   * @param stakeIndex the index on the underlying contract to end stake
   * @param stakeId the stake id from the underlying contract to end stake
   * @notice this is not payable to match the underlying contract
   * @notice this moves funds back to the sender to make behavior match underlying token
   * @notice this method only checks that the sender owns the stake it does not care
   * if it is managed in a created contract and externally endable by this contract (1)
   * or requires that the staker send start and end methods (0)
   */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) external override {
    _stakeEndByOwner(msg.sender, stakeIndex, stakeId);
  }
  /**
   * end a stake given its owner
   * @param staker the staker that owns the stake
   * @param stakeIndex the index under which the stake is held
   * @param stakeId the id of the stake
   * @notice that tokens are sent to the sending address as if one were
   * interacting with the underlying contract
   */
  function _stakeEndByOwner(
    address staker, uint256 stakeIndex, uint256 stakeId
  ) internal {
    if (stakeIdToOwner[stakeId] != staker) {
      revert StakeNotEndable(stakeId, uint160(staker));
    }
    uint256 amount = _stakeEnd(stakeIndex, stakeId);
    _withdrawTokenTo(staker, amount);
  }
}
