// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Capable {
  /**
   * check if the number, in binary form, has a 1 at the provided index
   * @param setting the setting number that holds up to 256 flags as 1/0
   * @param index the index to check for a 1
   */
  function isCapable(uint256 setting, uint256 index) external pure returns(bool) {
    return _isCapable(setting, index);
  }
  function _isCapable(uint256 setting, uint256 index) internal pure returns(bool) {
    // in binary checks:
    // take the setting and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    return 1 == (setting << (255 - index) >> 255);
  }
}
