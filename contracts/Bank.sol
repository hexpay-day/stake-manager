// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./Capable.sol";
import "./Utils.sol";

contract Bank is Capable, Utils {
  using Address for address payable;
  using SafeERC20 for IERC20;

  mapping(address => uint256) public attributed;
  mapping(address => mapping(address => uint256)) public withdrawableBalanceOf;
  /**
   * gets unattributed tokens floating in the contract
   */
  function _getUnattributed(address token) internal view returns(uint256) {
    return _getBalance({
      token: token,
      owner: address(this)
    }) - attributed[token];
  }
  function _getBalance(address token, address owner) internal view returns(uint256) {
    return token == address(0) ? owner.balance : IERC20(token).balanceOf(owner);
  }
  /**
   * gets the amount of unattributed tokens
   */
  function getUnattributed(address token) external view returns(uint256) {
    return _getUnattributed({
      token: token
    });
  }
  /**
   * given a provided input amount, clamp the input to a maximum, using maximum if 0 provided
   * @param amount the requested or input amount
   * @param max the maximum amount that the value can be
   */
  function clamp(uint256 amount, uint256 max) external pure returns(uint256) {
    return _clamp({
      amount: amount,
      max: max
    });
  }
  /**
   * clamp a given amount to the maximum amount
   * use the maximum amount if no amount is requested
   * @param amount the amount requested by another function
   * @param max the limit that the value can be
   */
  function _clamp(uint256 amount, uint256 max) internal pure returns(uint256) {
    return amount == 0 || amount > max ? max : amount;
  }
  /**
   * transfer a given number of tokens to the contract to be used by the contract's methods
   * @param amount the number of tokens to transfer to the contract
   * @notice an extra layer of protection is provided by this method
   * and can be refused by calling the dangerous version
   */
  function depositToken(address token, uint256 amount) external payable returns(uint256) {
    return _depositTokenTo({
      token: token,
      to: msg.sender,
      amount: amount
    });
  }
  /**
   * deposit an amount of tokens to the contract and attribute
   * them to the provided address
   * @param to the account to give ownership over tokens
   * @param amount the amount of tokens
   */
  function depositTokenTo(address token, address to, uint256 amount) external payable returns(uint256) {
    return _depositTokenTo({
      token: token,
      to: to,
      amount: amount
    });
  }
  function _depositTokenTo(address token, address to, uint256 amount) internal returns(uint256) {
    amount = _depositTokenFrom({
      token: token,
      depositor: msg.sender,
      amount: amount
    });
    _addToTokenWithdrawable({
      token: token,
      to: to,
      amount: amount
    });
    return amount;
  }
  /**
   * collect unattributed tokens and send to recipient of choice
   * @param transferOut transfers tokens to the provided address
   * @param to the address to receive or have tokens attributed to
   * @param amount the requested amount - clamped to the amount unattributed
   * @notice when 0 is passed, withdraw maximum available
   * or in other words, all unattributed tokens
   */
  function collectUnattributed(
    address token, bool transferOut,
    address payable to,
    uint256 amount
  ) external payable returns(uint256) {
    return _collectUnattributed(token, transferOut, to, amount, _getUnattributed(token));
  }
  function _collectUnattributed(
    address token, bool transferOut, address payable to,
    uint256 amount, uint256 max
  ) internal returns(uint256 withdrawable) {
    withdrawable = _clamp(amount, max);
    if (withdrawable > 0) {
      if (transferOut) {
        _withdrawTokenTo({
          token: token,
          to: to,
          amount: withdrawable
        });
      } else {
        _addToTokenWithdrawable({
          token: token,
          to: to,
          amount: withdrawable
        });
      }
    }
  }
  /**
   * collect a number of unattributed tokens as basis points
   * @param token the token that you wish to collect
   * @param transferOut whether to transfer token out
   * @param recipient the recipient of the tokens
   * @param basisPoints the number of basis points (100% = 10_000)
   */
  function collectUnattributedPercent(
    address token, bool transferOut, address payable recipient,
    uint256 basisPoints
  ) external returns(uint256 amount) {
    uint256 unattributed = _getUnattributed(token);
    amount = (unattributed * basisPoints) / 10_000;
    _collectUnattributed(token, transferOut, recipient, amount, unattributed);
  }
  /**
   * transfer an amount of tokens currently attributed to the withdrawable balance of the sender
   * @param token the token to transfer - uses address(0) for native
   * @param to the to of the funds
   * @param amount the amount that should be deducted from the sender's balance
   */
  function withdrawTokenTo(address token, address payable to, uint256 amount) external payable returns(uint256) {
    return _withdrawTokenTo({
      token: token,
      to: to,
      amount: _deductWithdrawable({
        token: token,
        account: msg.sender,
        amount: amount
      })
    });
  }
  function _getTokenBalance(address token) internal view returns(uint256) {
    return token == address(0)
      ? address(this).balance
      : IERC20(token).balanceOf(address(this));
  }

  /**
   * adds a balance to the provided staker of the magnitude given in amount
   * @param to the account to add a withdrawable balance to
   * @param amount the amount to add to the staker's withdrawable balance as well as the attributed tokens
   */
  function _addToTokenWithdrawable(address token, address to, uint256 amount) internal {
    unchecked {
      withdrawableBalanceOf[token][to] = withdrawableBalanceOf[token][to] + amount;
      attributed[token] = attributed[token] + amount;
    }
  }
  /**
   * deduce an amount from the provided account
   * @param account the account to deduct funds from
   * @param amount the amount of funds to deduct
   * @notice after a deduction, funds could be considered "unattributed"
   * and if they are left in such a state they could be picked up by anyone else
   */
  function _deductWithdrawable(address token, address account, uint256 amount) internal returns(uint256) {
    uint256 withdrawable = withdrawableBalanceOf[token][account];
    amount = _clamp({
      amount: amount,
      max: withdrawable
    });
    unchecked {
      withdrawableBalanceOf[token][account] = withdrawable - amount;
      attributed[token] = attributed[token] - amount;
    }
    return amount;
  }
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address token, address depositor, uint256 amount) internal returns(uint256 amnt) {
    if (token != address(0)) {
      if (amount > 0) {
        IERC20(token).safeTransferFrom(depositor, address(this), amount);
        amnt = amount;
      }
    } else {
      // transfer in already occurred
      // make sure that multicall is not payable (it isn't)
      amnt = msg.value;
    }
  }
  /**
   * deposit a number of tokens to the contract
   * @param amount the number of tokens to deposit
   */
  function depositTokenUnattributed(address token, uint256 amount) external {
    _depositTokenFrom({
      token: token,
      depositor: msg.sender,
      amount: amount
    });
  }
  /**
   * transfers tokens to a recipient
   * @param to where to send the tokens
   * @param amount the number of tokens to send
   */
  function _withdrawTokenTo(address token, address payable to, uint256 amount) internal returns(uint256) {
    if (token == address(0)) {
      to.sendValue(amount);
    } else {
      IERC20(token).safeTransfer(to, amount);
    }
    return amount;
  }
  function _attributeFunds(uint256 setting, uint256 index, address token, address staker, uint256 amount) internal {
    if (_isCapable({
      setting: setting,
      index: index
    })) {
      _withdrawTokenTo({
        token: token,
        to: payable(staker),
        amount: amount
      });
    } else {
      _addToTokenWithdrawable({
        token: token,
        to: staker,
        amount: amount
      });
    }
  }
}
