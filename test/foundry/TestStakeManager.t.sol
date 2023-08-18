// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { StakeManager } from "contracts/StakeManager.sol";
import { EncodableSettings } from "contracts/EncodableSettings.sol";
import { Multicall } from "contracts/Multicall.sol";
import { IHEX } from "contracts/IHEX.sol";

contract TestStakeManager is Test {
  StakeManager public stkMngr;
  address public hx = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public pulsexSacrifice = 0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8;
  address public pulsexSacrificeMainnet = 0x5280aa3cF5D6246B8a17dFA3D75Db26617B73937;
  uint256 public decimalShift;
  uint256 public startingBalance;
  uint256 public nextStakeId;
  uint256 public defaultEncodedSettings;
  function setUp() public virtual {
    stkMngr = new StakeManager();
    defaultEncodedSettings = stkMngr.defaultEncodedSettings();
    uint256 decimals = 8; //IERC20Metadata(hx).decimals();
    decimalShift = 10**decimals;
    startingBalance = 1_000_000 * decimalShift;
    address impersonate = pulsexSacrifice;
    uint256 balanceOfWhale = IERC20(hx).balanceOf(impersonate);
    if (balanceOfWhale == 0) {
      impersonate = pulsexSacrificeMainnet;
    }
    vm.startPrank(impersonate);
    for (uint256 i = 1; i <= 100; ++i) {
      IERC20(hx).transfer(vm.addr(i), startingBalance);
    }
    vm.stopPrank();
    for (uint256 i = 1; i <= 100; ++i) {
      vm.startPrank(vm.addr(i));
      IERC20(hx).approve(address(stkMngr), type(uint256).max);
      vm.stopPrank();
    }
    uint256[13] memory globalInfo = IHEX(hx).globalInfo();
    // [, , , , , , stakeIdBN]
    nextStakeId = globalInfo[6] + 1;
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(100)), startingBalance);
  }
  function _moveDays(address marcher, uint256 numDays) internal {
    while (numDays > 0) {
      skip(24*60*60);
      vm.startPrank(marcher);
      IHEX(hx).stakeStart(1 * decimalShift, 5555);
      vm.stopPrank();
      numDays = numDays - 1;
    }
  }
  function _depositTokenFrom(address sender, uint256 amount) internal {
    vm.startPrank(sender);
    stkMngr.depositToken(hx, amount);
    vm.stopPrank();
  }
  function _withdrawToken(address sender, address payable receipient, uint256 amount) internal {
    vm.startPrank(sender);
    stkMngr.withdrawTokenTo(hx, receipient, amount);
    vm.stopPrank();
  }
  function _transferTo(address sender, address recipient, uint256 amount) internal {
    vm.startPrank(sender);
    IERC20(hx).transfer(recipient, amount);
    vm.stopPrank();
  }
  function _stakeStart(address sender, uint256 amount, uint256 stakeDays) internal {
    vm.startPrank(sender);
    stkMngr.stakeStart(amount, stakeDays);
    vm.stopPrank();
  }
  function _managedStakeStart(address sender, uint256 amount, uint256 stakeDays) internal {
    vm.startPrank(sender);
    stkMngr.stakeStartFromBalanceFor(sender, amount, stakeDays, defaultEncodedSettings);
    vm.stopPrank();
  }
  function _managedStakeEndById(address sender, uint256 stakeId) internal {
    vm.startPrank(sender);
    stkMngr.stakeEndById(stakeId);
    vm.stopPrank();
  }
  function _managedStakeEndByIdMany(address sender, uint256[] memory stakeIds) internal {
    vm.startPrank(sender);
    uint256 len = stakeIds.length;
    uint256 i;
    bytes[] memory calls = new bytes[](len);
    do {
      calls[i] = abi.encodeWithSelector(stkMngr.stakeEndByConsentForMany.selector, stakeIds[i]);
      unchecked {
        ++i;
      }
    } while (i < len);
    stkMngr.multicall(calls, false);
    vm.stopPrank();
  }
  function _stakeEndByConsentForMany(
    address ender,
    uint256[] memory list
  ) internal {
    vm.startPrank(ender);
    stkMngr.stakeEndByConsentForMany(list);
    vm.stopPrank();
  }
  function _stakeRestartManyById(address staker, uint256[] memory stakeIds) internal {
    vm.startPrank(staker);
    stkMngr.stakeRestartManyById(stakeIds);
    vm.stopPrank();
  }
  function _stakeRestartById(address staker, uint256 stakeId) internal {
    vm.startPrank(staker);
    stkMngr.stakeRestartById(stakeId);
    vm.stopPrank();
  }
  function _stakeEndByConsent(
    address ender,
    uint256 stakeId
  ) internal {
    vm.startPrank(ender);
    stkMngr.stakeEndByConsent(stakeId);
    vm.stopPrank();
  }
  function _directStakeStart(address sender, uint256 amount, uint256 daysStaked) internal {
    vm.startPrank(sender);
    IHEX(hx).stakeStart(amount, daysStaked);
    vm.stopPrank();
  }
  function _directStakeEnd(address sender, uint256 index, uint256 stakeId) internal {
    vm.startPrank(sender);
    IHEX(hx).stakeEnd(index, uint40(stakeId));
    vm.stopPrank();
  }
  function _updateSettings(address stakeOwner, uint256 stakeId, EncodableSettings.Settings memory settings) internal {
    vm.startPrank(stakeOwner);
    stkMngr.updateSettings(stakeId, settings);
    vm.stopPrank();
  }
}
