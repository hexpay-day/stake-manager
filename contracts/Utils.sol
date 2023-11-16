// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

contract Utils {
  /**
   * @notice the not allowed method is a general error that signifies
   * non descript permissions issues. All transactions should always be simulated
   * either by using gas estimations or through a static call
   */
  error NotAllowed();
  // SLOT
  /**
   * @notice the hex contract to target - because this is the same on ethereum
   * and pulsechain, we can leave it as a constant
   */
  address public constant TARGET = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  /**
   * @notice a constant for the max number of days that can be used
   * when determining the number algorhythmically
   */
  uint16 public constant MAX_DAYS = 5555;
  /** @notice the number of binary slots in a 256 sized uint */
  uint16 internal constant SLOTS = 256;
  /** @notice a number to use as the denominator when determining basis points */
  uint16 internal constant TEN_K = 10_000;
  /** @notice the number of bits in an address */
  uint8 internal constant ADDRESS_BIT_LENGTH = 160;
  /** @notice the minimum value that can exist in a int16 (-2^15) */
  int16 constant internal MIN_INT_16 = int16(type(int16).min);
  /** @notice the max value that can fit in a uint8 slot (255) */
  uint8 internal constant MAX_UINT_8 = type(uint8).max;
  /** @notice the max value that can fit in a uint8 slot (127) */
  uint8 internal constant MAX_UINT_7 = MAX_UINT_8 / TWO;
  /** @notice a uint8 as 0 in a constant */
  uint8 internal constant ZERO = 0;
  // SLOT
  /** @notice the max uint256 that can be used */
  uint256 internal constant MAX_UINT_256 = type(uint256).max;
  // SLOT
  /** @notice a uint8 as 1 in a constant */
  uint8 internal constant ONE = 1;
  /** @notice a uint8 as 2 in a constant */
  uint8 internal constant TWO = 2;
  /** @notice a uint8 as 3 in a constant */
  uint8 internal constant THREE = 3;
  /** @notice a uint8 as 4 in a constant */
  uint8 internal constant FOUR = 4;
  /** @notice a uint8 as 8 in a constant */
  uint8 internal constant EIGHT = 8;
  /** @notice a uint8 as 16 in a constant */
  uint8 internal constant SIXTEEN = 16;
  /** @notice a uint8 as 24 in a constant */
  uint8 internal constant TWENTY_FOUR = 24;
  /** @notice a uint8 as 32 in a constant */
  uint8 internal constant THIRTY_TWO = 32;
  /** @notice a uint8 as 48 in a constant */
  uint8 internal constant FOURTY_EIGHT = 48;
  /** @notice a uint8 as 56 in a constant */
  uint8 internal constant FIFTY_SIX = 56;
  /** @notice a uint8 as 64 in a constant */
  uint8 internal constant SIXTY_FOUR = 64;
  /** @notice the hedron contract to interact with and mint hedron tokens from */
  address public constant HEDRON = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  // SLOT
  /**
   * @notice the hedron stake instance manager contract
   * to interact with and transfer hsi tokens from and end stakes through
   */
  address public constant HSIM = 0x8BD3d1472A656e312E94fB1BbdD599B8C51D18e3;
  /**
   * @notice the address to mint communis tokens
   */
  address public constant COMM = 0x5A9780Bfe63f3ec57f01b087cD65BD656C9034A8;
  /**
   * check if the number, in binary form, has a 1 at the provided index
   * @param settings the settings number that holds up to 256 flags as 1/0
   * @param index the index to check for a 1
   */
  function _isOneAtIndex(uint256 settings, uint256 index) internal pure returns(bool isOne) {
    // in binary checks:
    // take the settings and shift it some number of bits left (leaving space for 1)
    // then go the opposite direction, once again leaving only space for 1
    unchecked {
      return ONE == (settings << (MAX_UINT_8 - index) >> MAX_UINT_8);
    }
  }
  /**
   * after an error is caught, it can be reverted again
   * @param data the data to repackage and revert with
   */
  function _bubbleRevert(bytes memory data) internal pure {
    if (data.length == ZERO) revert();
    assembly {
      revert(add(32, data), mload(data))
    }
  }
  /**
   * given a provided input amount, clamp the input to a maximum, using maximum if 0 provided
   * @param amount the requested or input amount
   * @param max the maximum amount that the value can be
   * @return clamped the clamped value that is set to the limit if
   * 0 or a number above the limit is passed
   */
  function clamp(uint256 amount, uint256 max) external pure returns(uint256 clamped) {
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
   * @return clamped the clamped value that is set to the limit if
   * 0 or a number above the limit is passed
   */
  function _clamp(uint256 amount, uint256 max) internal pure returns(uint256 clamped) {
    unchecked {
      return amount == ZERO || amount > max ? max : amount;
    }
  }
}
