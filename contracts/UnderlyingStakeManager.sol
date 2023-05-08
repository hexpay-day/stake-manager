// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IsolatedStakeManager.sol";
import "./IUnderlyingStakeable.sol";
import "./UnderlyingStakeable.sol";
import "./IsolatedStakeManager.sol";
import "./Stakeable.sol";
import "./IStakeable.sol";

contract UnderlyingStakeManager is Stakeable, UnderlyingStakeable {
  /**
   * signals to enders that the early end state has changed
   * @param stakeId the stake id whos allow early end state has changed
   * @notice the state of the early end is not stored in the log
   * this is because, generally, early ending should only go one way
   * allowing, then disallowing early ending may cause enders to ignore stakes
   */
  event UpdateConsentEarlyEnd(uint256 indexed stakeId);
  // event StakeStart(address indexed staker, uint256 indexed stakeId);
  /**
   * @notice this event is thrown when the stake id provided
   * does not match what is expected given other contextual information
   * such as an index
   */
  error StakeIdMismatch(uint256 provided, uint256 expected);
  /**
   * @notice this error is thrown when the stake being ended is not yet ended
   */
  error StakeNotEndable(uint256 provided, uint256 expected);
  /**
   * @notice error is thrown when there is not enough funding to do the required operation
   */
  error NotEnoughFunding(uint256 provided, uint256 expected);
  /**
   * @notice a mapping of a key that contains a modifier and the owning address
   * pointing to the address of the contract created by the stake manager
   */
  mapping(address => address) public isolatedStakeManagers;
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
  /** checks the current day on the provided target */
  function _currentDay() internal view returns(uint256) {
    return IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).currentDay();
  }
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address staker, uint256 amount) internal {
    IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).transferFrom(staker, address(this), amount);
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
    IERC20(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).transfer(to, amount);
  }
  /**
   * stake a given number of tokens under an owner's control
   * @param staker the staker/owner of the stake
   * @param amount the number of tokens to stake
   * @param newStakedDays the number of days to stake for
   * @notice the amount param can be zero as that will use the balance of the isolatedStakeManager contract
   */
  function _externallyManagedStakeStartFor(
    address staker,
    uint256 amount, uint256 newStakedDays
  ) internal returns(uint256 stakeId, uint256 index) {
    // get future index of stake
    address _target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
    address custodian = _getIsolatedStakeManager(staker);
    index = IUnderlyingStakeable(_target).stakeCount(custodian);
    // start the stake
    IERC20(_target).approve(custodian, amount);
    IStakeable(custodian).stakeStart(amount, newStakedDays);
    // get the stake id
    stakeId = IStakeable(_target).stakeLists(custodian, index).stakeId;
  }
  function _internallyManagedStakeStartFor(
    uint256 amount, uint256 newStakedDays
  ) internal returns(uint256 stakeId, uint256 index) {
      // get future index of stake
      address _target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
      index = IUnderlyingStakeable(_target).stakeCount(address(this));
      IStakeable(_target).stakeStart(amount, newStakedDays);
      // get the stake id
      stakeId = IStakeable(_target).stakeLists(address(this), index).stakeId;
  }
  /**
   * start a stake for the staker given the amount and number of days
   * @param internallyManaged the config for starting a stake
   * @param staker the underlying owner of the stake
   * @param amount the amount to add to the stake
   * @param newStakedDays the number of days that the stake should run
   */
  function _stakeStartFor(
    bool internallyManaged, address staker,
    uint256 amount, uint256 newStakedDays
  ) internal returns(uint256 stakeId) {
    uint256 index;
    if (!internallyManaged) {
      (stakeId, index) = _externallyManagedStakeStartFor(staker, amount, newStakedDays);
    } else {
      (stakeId, index) = _internallyManagedStakeStartFor(amount, newStakedDays);
      stakeIdToIndex[stakeId] = index;
    }
    // attribute stake to the staker
    stakeIdToOwner[stakeId] = staker;
    // emit StakeStart(staker, stakeId);
  }
  /**
   * gets the stake store at the provided index
   * @param index the index of the stake to get
   */
  function _getStake(address custodian, uint256 index) internal view returns(IStakeable.StakeStore memory) {
    return IStakeable(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39).stakeLists(custodian, index);
  }
  /**
   * ends a stake for someone else
   * @param stakeIndex the stake index on the underlying contract to end
   * @param stakeId the stake id on the underlying contract to end
   */
  function _stakeEnd(
    bool internallyManaged, address owner,
    uint256 stakeIndex, uint256 stakeId
  ) internal returns(uint256 delta) {
    // calculate the balance before
    address _target = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
    // cannot use tokens attributed here because of tipping
    uint256 balanceBefore = IERC20(_target).balanceOf(address(this));
    address custodian = internallyManaged ? _target : owner;
    // end the stake - attributed to contract or through the managed stake
    IStakeable(custodian).stakeEnd(stakeIndex, uint40(stakeId));
    if (internallyManaged) {
      delete stakeIdToIndex[stakeId];
      if (IUnderlyingStakeable(_target).stakeCount(address(this)) > stakeIndex) {
        stakeIdToIndex[_getStake(address(this), stakeIndex).stakeId] = stakeIndex;
      }
    }
    // because the delta is only available in the logs
    // we need to calculate the delta to use it
    unchecked {
      delta = IERC20(_target).balanceOf(address(this)) - balanceBefore;
    }
    delete stakeIdToOwner[stakeId];
  }
  /**
   * @param staker the underlying owner of the stake
   */
  function _getIsolatedStakeManager(address staker) internal returns(address existing) {
    existing = isolatedStakeManagers[staker];
    if (existing != address(0)) {
      return existing;
    }
    // this scopes up to 2 stake managers to a single address
    // one that can only be ended by the staker one that can be ended by the stake manager
    existing = address(new IsolatedStakeManager{salt: keccak256(abi.encode(staker))}(staker));
    isolatedStakeManagers[staker] = existing;
  }
  function getIsolatedStakeManager(address staker) external returns(address) {
    return _getIsolatedStakeManager(staker);
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
      false, msg.sender,
      amount, newStakedDays
    );
  }
  /**
   * stake tokens for a provided number of days
   * @param internallyManaged flag to start the stake against the owner or against this contract
   * @param amount the number of tokens to start staking
   * @param newStakedDays the number of days to stake
   */
  function managedStakeStart(
    bool internallyManaged,
    uint256 amount,
    uint256 newStakedDays
  ) external payable {
    _depositTokenFrom(msg.sender, amount);
    _stakeStartFor(
      internallyManaged, msg.sender,
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
    _stakeEndByOwner(false, msg.sender, stakeIndex, stakeId);
  }
  /**
   * end a stake that the sender owns as if they are interacting with
   * the underlying contract
   * @param internallyManaged where the stake is being custodied
   * @param stakeIndex the index under which the stake is held
   * @param stakeId the id of the stake
   */
  function managedStakeEnd(bool internallyManaged, uint256 stakeIndex, uint256 stakeId) external {
    _stakeEndByOwner(internallyManaged, msg.sender, stakeIndex, stakeId);
  }
  /**
   * end a stake given its owner
   * @param internallyManaged where the stake is being custodied
   * @param staker the staker that owns the stake
   * @param stakeIndex the index under which the stake is held
   * @param stakeId the id of the stake
   * @notice that tokens are sent to the sending address as if one were
   * interacting with the underlying contract
   */
  function _stakeEndByOwner(
    bool internallyManaged, address staker, uint256 stakeIndex, uint256 stakeId
  ) internal {
    if (stakeIdToOwner[stakeId] != staker) {
      revert StakeNotEndable(stakeId, uint160(staker));
    }
    address custodian = internallyManaged ? address(this) : isolatedStakeManagers[staker];
    uint256 amount = _stakeEnd(internallyManaged, custodian, stakeIndex, stakeId);
    _withdrawTokenTo(staker, amount);
  }
}
