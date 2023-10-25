// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { Utils } from "./Utils.sol";

/**
 * @title Ownable2Step
 * @author openzeppelin
 * @notice a very short replacement for Ownable2Step from oz
 */
contract Ownable2Step is Utils {
  address public owner;
  address public pendingOwner;
  error OnlyOwner();
  event OwnershipTransferred(address indexed previousOwner, address indexed owner);
  event OwnershipTransferStarted(address indexed owner, address indexed pendingOwner);
  function _transferOwnership(address account) internal {
    emit OwnershipTransferred({
      previousOwner: owner,
      owner: account
    });
    pendingOwner = address(0);
    owner = account;
  }
  function transferOwnership(address account) external {
    emit OwnershipTransferStarted({
      owner: owner,
      pendingOwner: account
    });
    pendingOwner = account;
  }
  function acceptOwnership() external {
    if (msg.sender != pendingOwner) {
      revert NotAllowed();
    }
    _transferOwnership(msg.sender);
  }
  function _onlyOwner() internal view {
    if (msg.sender != owner) revert OnlyOwner();
  }
}
