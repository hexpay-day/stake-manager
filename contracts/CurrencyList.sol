// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./Utils.sol";

contract CurrencyList is Utils {
  using Address for address;

  event AddCurrency(
    address indexed token,
    uint256 indexed index
  );

  address[] public indexToToken;
  mapping(address => uint256) public currencyToIndex;
  /**
   * creates a registry of tokens to map addresses that stakes will tip in
   * to numbers so that they can fit in a single byteword,
   * reducing costs when tips in the same currency occur
   * @param token the token to add to the list of tippable tokens
   */
  function addCurrencyToList(address token) external returns(uint256) {
    // token must already exist - helps prevent grief attacks
    if (!token.isContract()) {
      revert NotAllowed();
    }
    if (currencyToIndex[token] > 0 || token == address(0)) {
      return currencyToIndex[token];
    }
    return _addCurrencyToList(token);
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
  function currencyListSize() external view returns(uint256) {
    return indexToToken.length;
  }
}
