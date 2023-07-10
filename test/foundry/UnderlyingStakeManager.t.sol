// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "contracts/UnderlyingStakeManager.sol";
import "contracts/SingletonStakeManager.sol";
import "contracts/StakeManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "contracts/IUnderlyingStakeable.sol";
import "contracts/IStakeable.sol";
import "forge-std/console2.sol";

contract TestStakeManager is Test {
  StakeManager public stkMngr;
  address public hx = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public pulsexSacrifice = 0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8;
  address public pulsexSacrificeMainnet = 0x5280aa3cF5D6246B8a17dFA3D75Db26617B73937;
  uint256 public decimalShift;
  uint256 public startingBalance;
  uint256 public nextStakeId;
  function setUp() public {
    stkMngr = new StakeManager();
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
    uint256[13] memory globalInfo = IUnderlyingStakeable(hx).globalInfo();
    // [, , , , , , stakeIdBN]
    nextStakeId = globalInfo[6] + 1;
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(100)), startingBalance);
  }
  function _moveDays(address marcher, uint256 numDays) internal {
    while (numDays > 0) {
      skip(24*60*60);
      vm.startPrank(marcher);
      IStakeable(hx).stakeStart(1 * decimalShift, 5555);
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
    stkMngr.stakeStart(amount, stakeDays);
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
  function _directStakeStart(address sender, uint256 amount, uint256 daysStaked) internal {
    vm.startPrank(sender);
    IStakeable(hx).stakeStart(amount, daysStaked);
    vm.stopPrank();
  }
  function _directStakeEnd(address sender, uint256 index, uint256 stakeId) internal {
    vm.startPrank(sender);
    IStakeable(hx).stakeEnd(index, uint40(stakeId));
    vm.stopPrank();
  }
}

contract TestSingletonStakeManager is TestStakeManager {
  function testDeposits() public {
    _depositTokenFrom(vm.addr(1), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), 0);
    assertEq(IERC20(hx).balanceOf(address(stkMngr)), startingBalance);
    assertEq(stkMngr.withdrawableBalanceOf(hx, vm.addr(1)), startingBalance);
    assertEq(stkMngr.attributed(hx), startingBalance);
    _depositTokenFrom(vm.addr(2), startingBalance);
    // balances are tracked independently for each sendeer
    assertEq(stkMngr.withdrawableBalanceOf(hx, vm.addr(1)), startingBalance);
    assertEq(stkMngr.withdrawableBalanceOf(hx, vm.addr(2)), startingBalance);
    // a global amount is collected as well
    assertEq(stkMngr.attributed(hx), startingBalance * 2);
  }
  function testWithdrawalLimits() public {
    // alice deposits
    _depositTokenFrom(vm.addr(1), startingBalance);
    _withdrawToken(vm.addr(2), payable(vm.addr(1)), 1);
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), startingBalance + 1);
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), startingBalance);
    // using 0 withdraws the remaining balance
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), 0);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
  }
  function testWithdrawTo() public {
    _depositTokenFrom(vm.addr(1), startingBalance);
    // alice can withdraw her tokens
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    assertEq(stkMngr.withdrawableBalanceOf(hx, vm.addr(1)), startingBalance / 2);
    // and can send withdrawable tokens to bob through the contract
    assertEq(IERC20(hx).balanceOf(vm.addr(2)), startingBalance);
    _withdrawToken(vm.addr(1), payable(vm.addr(2)), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(payable(vm.addr(2))), startingBalance * 3 / 2);
    _transferTo(vm.addr(2), vm.addr(1), startingBalance / 2);
  }
  function testDirectStakeRestartSingle() public {
    _directStakeStart(vm.addr(1), startingBalance / 10, 20);
    _moveDays(vm.addr(5), 21);
    _directStakeEnd(vm.addr(1), 0, nextStakeId);
    _directStakeStart(vm.addr(1), startingBalance / 10, 20);
  }
  function testDirectStakeRestart() public {
    _directStakeStart(vm.addr(1), startingBalance / 10, 20);
    _directStakeStart(vm.addr(2), startingBalance / 10, 20);
    _moveDays(vm.addr(5), 21);
    _directStakeEnd(vm.addr(1), 0, nextStakeId);
    _directStakeEnd(vm.addr(2), 0, nextStakeId + 1);
    _directStakeStart(vm.addr(1), startingBalance / 10, 20);
    _directStakeStart(vm.addr(2), startingBalance / 10, 20);
  }
  function testStakeRestarts() public {
    _stakeStart(vm.addr(1), startingBalance / 2, 20);
    _stakeStart(vm.addr(1), startingBalance / 2, 20);
    _moveDays(vm.addr(5), 21);
    bytes[] memory calls = new bytes[](4);
    calls[0] = abi.encodeWithSelector(
      UnderlyingStakeManager.stakeEnd.selector,
      1, nextStakeId + 1
    );
    calls[1] = abi.encodeWithSelector(
      UnderlyingStakeManager.stakeEnd.selector,
      0, nextStakeId
    );
    calls[2] = abi.encodeWithSelector(
      UnderlyingStakeManager.stakeStart.selector,
      startingBalance / 2, 20
    );
    calls[3] = abi.encodeWithSelector(
      UnderlyingStakeManager.stakeStart.selector,
      startingBalance / 2, 20
    );
    vm.startPrank(vm.addr(1));
    Multicall(stkMngr).multicall(calls, false);
    vm.stopPrank();
  }
  function testManagedStakeRestarts() public {
    _managedStakeStart(vm.addr(1), startingBalance / 10, 20);
    _managedStakeStart(vm.addr(1), startingBalance / 10, 20);
    _moveDays(vm.addr(5), 21);
    uint256[] memory list = new uint256[](2);
    list[0] = nextStakeId + 1;
    list[1] = nextStakeId;
    _stakeEndByConsentForMany(vm.addr(1), list);
  }
}
