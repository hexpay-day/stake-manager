// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

contract Capable {
  function isCapable(uint256 setting, uint256 index) external pure returns(bool) {
    return checkBinary(setting, index);
  }
  function checkBinary(uint256 setting, uint256 index) internal pure returns(bool) {
    // in binary checks:
    // take the setting and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    return 1 == (setting << (255 - index) >> 255);
  }
}