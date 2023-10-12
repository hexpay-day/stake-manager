// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { Utils } from "./Utils.sol";
import { SafeTransferLib, ERC20 } from "solmate/src/utils/SafeTransferLib.sol";

/**
 * @title A subcontract to track balances of deposited tokens
 */
contract Bank is Utils {
  using SafeTransferLib for address;
  using SafeTransferLib for ERC20;

  /**
   * notes that a previously unattributed token has been
   * collected and attributed to an address
   * @param token the token that is being collected by the caller
   * @param to the address that the tokens are being attributed to
   * @param amount the number of tokens being collected for the to address
   */
  event CollectUnattributedToken(address indexed token, address indexed to, uint256 amount);
  /**
   * @notice keeps a global mapping of attributed funds that the contract is custodying
   */
  mapping(address token => uint256 balance) public attributed;
  /**
   * @notice keeps a mapping of the withdrawable funds that the contract is custodying
   * the contract may also be custodying tips, but an amount held within
   * a tip is not withdrawable so it cannot be held in this mapping
   */
  mapping(address token => mapping(address account => uint256 balance)) public withdrawableBalanceOf;
  /**
   * gets unattributed tokens floating in the contract
   * @param token the address of the token that you wish to get the unattributed value of
   * @return amount representing the amount of tokens that have been
   * deposited into the contract, which are not attributed to any address
   */
  function _getUnattributed(address token) internal view returns(uint256 amount) {
    return _getBalance({
      token: token,
      owner: address(this)
    }) - attributed[token];
  }
  /**
   * get the balance and ownership of any token
   * @param token the token address that you wish to get the balance of (including native)
   * @param owner the owner address to get the balance of
   * @return amount of a balance custodied by this contract
   */
  function _getBalance(address token, address owner) internal view returns(uint256 amount) {
    return token == address(0) ? owner.balance : ERC20(token).balanceOf(owner);
  }
  /**
   * gets the amount of unattributed tokens
   * @param token the token to get the unattributed balance of
   * @return amount of a token that can be withdrawn
   */
  function getUnattributed(address token) external view returns(uint256 amount) {
    return _getUnattributed({
      token: token
    });
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
    if (amount > ZERO) {
      _addToTokenWithdrawable({
        token: token,
        to: to,
        amount: amount
      });
    }
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
    address to,
    uint256 amount
  ) external payable returns(uint256) {
    return _collectUnattributed({
      token: token,
      transferOut: transferOut,
      to: to,
      amount: amount,
      max: _getUnattributed(token)
    });
  }
  function _collectUnattributed(
    address token, bool transferOut, address to,
    uint256 amount, uint256 max
  ) internal returns(uint256 withdrawable) {
    withdrawable = _clamp(amount, max);
    if (withdrawable > ZERO) {
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
      emit CollectUnattributedToken({
        token: token,
        to: to,
        amount: amount
      });
    }
  }
  /**
   * collect a number of unattributed tokens as basis points
   * @param token the token that you wish to collect
   * @param transferOut whether to transfer token out
   * @param recipient the recipient of the tokens
   * @param basisPoints the number of basis points (100% = 10_000)
   * @notice collecting unattributed percentages should
   * be used before a blanket collection
   * in order to reduce rounding errors
   * @dev please be sure to run blanket collect unattributed
   * calls to collect any remaining tokens
   */
  function collectUnattributedPercent(
    address token, bool transferOut, address payable recipient,
    uint256 basisPoints
  ) external payable returns(uint256 amount) {
    uint256 unattributed = _getUnattributed(token);
    amount = (unattributed * basisPoints) / TEN_K;
    _collectUnattributed(token, transferOut, recipient, amount, unattributed);
  }
  /**
   * transfer an amount of tokens currently attributed to the withdrawable balance of the sender
   * @param token the token to transfer - uses address(0) for native
   * @param to the to of the funds
   * @param amount the amount that should be deducted from the sender's balance
   */
  function withdrawTokenTo(address token, address to, uint256 amount) external payable returns(uint256) {
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
      : ERC20(token).balanceOf(address(this));
  }

  /**
   * adds a balance to the provided staker of the magnitude given in amount
   * @param token the token being accounted for
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
  function _deductWithdrawable(address token, address account, uint256 amount) internal returns(uint256 value) {
    uint256 withdrawable = withdrawableBalanceOf[token][account];
    value = _clamp({
      amount: amount,
      max: withdrawable
    });
    if (value > ZERO) {
      unchecked {
        withdrawableBalanceOf[token][account] = withdrawable - value;
        attributed[token] = attributed[token] - value;
      }
    }
  }
  /** deposits tokens from a staker and marks them for that staker */
  function _depositTokenFrom(address token, address depositor, uint256 amount) internal returns(uint256 amnt) {
    if (token != address(0)) {
      if (amount > ZERO) {
        amnt = ERC20(token).balanceOf(address(this));
        ERC20(token).safeTransferFrom(depositor, address(this), amount);
        amnt = ERC20(token).balanceOf(address(this)) - amnt;
      }
    } else {
      // transfer in already occurred
      // make sure that multicall is not payable
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
  function _withdrawTokenTo(address token, address to, uint256 amount) internal returns(uint256) {
    if (amount > ZERO) {
      if (token == address(0)) {
        to.safeTransferETH(amount);
      } else {
        ERC20(token).safeTransfer(to, amount);
      }
    }
    return amount;
  }
  function _attributeFunds(uint256 settings, address token, address staker, uint256 amount) internal {
    if (_isOneAtIndex({
      settings: settings,
      index: FOUR
    })) {
      _withdrawTokenTo({
        token: token,
        to: staker,
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
