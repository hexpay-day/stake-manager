// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { SafeTransferLib, ERC20 } from "solmate/src/utils/SafeTransferLib.sol";
import { Utils } from "./Utils.sol";

contract CurrencyList is Utils {
  /**
   * a new token was added to the list of acceptable tip tokens
   * @param token a token address was added to the list
   * @param index the index of the token address in the `indexToToken` list
   */
  event AddCurrency(
    address indexed token,
    uint256 indexed index
  );

  /** @notice must be token holder to add tokens to list */
  error MustBeHolder();

  /**
   * this list allows us to access from idx->address,
   * to potentially remove an sload from tip settings
   * depending on overlap from other stake ends
   */
  address[] public indexToToken;
  /** maps tokens back to indexes for easy lookups off or on chain */
  mapping(address token => uint256 index) public currencyToIndex;
  /**
   * creates a registry of tokens to map addresses that stakes will tip in
   * to numbers so that they can fit in a single byteword,
   * reducing costs when tips in the same currency occur
   * @param token the token to add to the list of tippable tokens
   */
  function addCurrencyToList(address token) external payable returns(uint256) {
    if (currencyToIndex[token] > ZERO || token == address(0)) {
      return currencyToIndex[token];
    }
    // token must already exist
    if (token.code.length == ZERO) {
      revert NotAllowed();
    }
    if (ERC20(token).balanceOf(msg.sender) == ZERO) {
      revert MustBeHolder();
    }
    // add token to list
    return _addCurrencyToList({
      token: token
    });
  }
  /**
   * adds a hash to a list and mapping to fit them in smaller sload counts
   * @param token the token to add to the internally tracked list and mapping
   */
  function _addCurrencyToList(address token) internal returns(uint256) {
    uint256 index = indexToToken.length;
    currencyToIndex[token] = index;
    indexToToken.push(token);
    emit AddCurrency(token, index);
    return index;
  }
  /** reads the length of the indexToToken list to get iteration constraints */
  function currencyListSize() external view returns(uint256) {
    return indexToToken.length;
  }
}
