// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.18;

contract Utils {
  error NotAllowed();
  address public constant TARGET = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  uint256 public constant MAX_DAYS = uint256(5555);
  uint256 internal constant SLOTS = uint256(256);
  uint256 internal constant TEN_K = uint256(10_000);
  uint256 internal constant ADDRESS_BIT_LENGTH = uint256(160);
  int256 constant internal MIN_INT_16 = int256(type(int16).min);
  uint256 internal constant MAX_UINT8 = uint256(type(uint8).max);
  uint256 internal constant ZERO = uint256(0);
  uint256 internal constant ONE = uint256(1);
  uint256 internal constant TWO = uint256(2);
  uint256 internal constant THREE = uint256(3);
  uint256 internal constant FOUR = uint256(4);
  uint256 internal constant EIGHT = uint256(8);
  uint256 internal constant SIXTEEN = uint256(16);
  uint256 internal constant TWENTY_FOUR = uint256(24);
  uint256 internal constant THIRTY_TWO = uint256(32);
  uint256 internal constant FOURTY = uint256(40);
  uint256 internal constant FOURTY_EIGHT = uint256(48);
  uint256 internal constant FIFTY_SIX = uint256(56);
  uint256 internal constant SEVENTY_TWO = uint256(72);
  address public constant HEDRON = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  address public constant HSIM = 0x8BD3d1472A656e312E94fB1BbdD599B8C51D18e3;
  /**
   * check if the number, in binary form, has a 1 at the provided index
   * @param setting the setting number that holds up to 256 flags as 1/0
   * @param index the index to check for a 1
   */
  function isCapable(uint256 setting, uint256 index) external pure returns(bool) {
    return _isCapable({
      setting: setting,
      index: index
    });
  }
  function _isCapable(uint256 setting, uint256 index) internal pure returns(bool) {
    // in binary checks:
    // take the setting and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    return 1 == (setting << (MAX_UINT8 - index) >> MAX_UINT8);
  }
}
