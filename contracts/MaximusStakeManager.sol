// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IPublicEndStakeable.sol";
import "./AuthorizationManager.sol";
import "./Multicall.sol";
import { IGasReimberser } from './GasReimberser.sol';

contract MaximusStakeManager is Ownable2Step, AuthorizationManager {
  using Address for address payable;
  mapping(address => bool) public perpetualWhitelist;
  receive() external payable {}
  constructor(address owner) AuthorizationManager(7) {
    /**
     * by index:
     * 0: end a stake
     * 1: flush tokens to this contract
     * 2: transfer tokens to a provided address
     */
    _setAddressAuthorization(owner, MAX_AUTHORIZATION);
    _transferOwnership(owner);
    // allows factory (central entry point)
    // to end a stake and nothing else
    _setAddressAuthorization(msg.sender, 1);
    // unfortunately, this is the appropriate place to have this code
    perpetualWhitelist[0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b] = true; // maxi
    perpetualWhitelist[0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6] = true; // deci
    perpetualWhitelist[0x6B0956258fF7bd7645aa35369B55B61b8e6d6140] = true; // lucky
    perpetualWhitelist[0xF55cD1e399e1cc3D95303048897a680be3313308] = true; // trio
    perpetualWhitelist[0xe9f84d418B008888A992Ff8c6D22389C2C3504e0] = true; // base
  }
  /**
   * check if the authorization level is available for a given address
   * @param runner the address to check authorization for
   * @param index the index to check (0,1,2) for different feature authorizations
   */
  function isAuthorized(address runner, uint256 index) external view returns(bool) {
    return _isAddressAuthorized(runner, index);
  }
  /**
   * set the authorization levels of an address
   * @param perpetual the address to check authorization for
   * @param settings the encoded settings to set
   */
  function setAuthorization(address perpetual, uint256 settings) external onlyOwner {
    _setAddressAuthorization(perpetual, settings);
  }
  /** check if the target address is a known perpetual */
  modifier isPerpetual(address perpetaul) {
    if (!perpetualWhitelist[perpetaul]) {
      revert NotAllowed();
    }
    _;
  }
  /**
   * end a stake on a known perpetual pool
   * @param pool the pool to end a stake on
   * @param stakeId the stake id to end
   */
  function stakeEnd(address pool, uint256 stakeId) external senderIsAuthorized(0) isPerpetual(pool) {
    IPublicEndStakeable endable = IPublicEndStakeable(pool);
    // STAKE_END_DAY is locked + staked days - 1 so > is correct in this case
    if (IHEX(target).currentDay() > endable.STAKE_END_DAY() && endable.STAKE_IS_ACTIVE()) {
      endable.endStakeHEX(0, uint40(stakeId));
    }
  }
  /**
   * flush native token into this contract
   * @param perpetual the perpetual pool to call flush on
   */
  function flushNative(address perpetual) external senderIsAuthorized(1) {
    IGasReimberser(perpetual).flush();
  }
  /**
   * flush erc20 tokens into this contract
   * @param perpetual the perpetual pool to call flush on
   * @param token the token address to flush into this contract
   */
  function flushErc20(address perpetual, address token) external senderIsAuthorized(1) {
    IGasReimberser(perpetual).flush_erc20(token);
  }
  /**
   * withdraw native tokens to a provided address
   * @param recipient recipient of the native tokens
   * @param amount the amount of tokens to send - 0 = balance
   */
  function withdrawNative(
    address payable recipient,
    uint256 amount
  ) external senderIsAuthorized(2) {
    uint256 bal = address(this).balance;
    amount = amount == 0 || amount > bal ? bal : amount;
    if (amount > 0) {
      recipient.sendValue(amount);
    }
  }
  /**
   * withdraw erc20 tokens to a provided address
   * @param recipient address to receive tokens
   * @param token token to send
   * @param amount amount of the token to send - 0 = balance
   */
  function withdrawErc20(
    address recipient,
    address token,
    uint256 amount
  ) external senderIsAuthorized(2) {
    uint256 bal = IERC20(token).balanceOf(address(this));
    amount = amount == 0 || amount > bal ? bal : amount;
    if (amount > 0) {
      IERC20(token).transfer(recipient, amount);
    }
  }
}
