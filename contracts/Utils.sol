// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

contract Utils {
  error NotAllowed();
  address public constant TARGET = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  uint16 public constant MAX_DAYS = 5555;
  uint16 internal constant SLOTS = 256;
  uint8 internal constant ADDRESS_BIT_LENGTH = 160;
  uint8 internal constant MAX_UINT8 = type(uint8).max;
  address public constant HEDRON = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  address public constant HSIM = 0x8BD3d1472A656e312E94fB1BbdD599B8C51D18e3;
}
