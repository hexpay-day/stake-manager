// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "contracts/StakeManager.sol";
import "contracts/ConsentualStakeManager.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "contracts/IUnderlyingStakeable.sol";
import "contracts/IStakeable.sol";
import "forge-std/console2.sol";

contract TestConsentualStakeManager is Test {
  ConsentualStakeManager public stkMngr;
  address public hx = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address public pulsexSacrifice = 0x075e72a5eDf65F0A5f44699c7654C1a76941Ddc8;
  uint256 public decimalShift;
  uint256 public startingBalance;
  constructor() Test() {
    stkMngr = new ConsentualStakeManager();
    uint256 decimals = IERC20Metadata(hx).decimals();
    decimalShift = 10**decimals;
    startingBalance = 1_000_000 * decimalShift;
    vm.startPrank(pulsexSacrifice);
    for (uint256 i = 1; i <= 100; ++i) {
      IERC20(hx).transfer(vm.addr(i), startingBalance);
    }
    vm.stopPrank();
    for (uint256 i = 1; i <= 100; ++i) {
      vm.startPrank(vm.addr(i));
      IERC20(hx).approve(address(stkMngr), type(uint256).max);
      vm.stopPrank();
    }
  }
  function setUp() public {
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(100)), startingBalance);
  }
  function _moveDay(address marcher) internal {
    vm.warp(block.timestamp * (24*60*60));
    vm.startPrank(marcher);
    IStakeable(hx).stakeStart(1 * decimalShift, 5555);
    vm.stopPrank();
  }
  function testPercentMagnitudeLimit() public {
    assertEq(stkMngr.percentMagnitudeLimit(), type(uint64).max);
  }
  function _depositToken(address sender, uint256 amount) internal {
    vm.startPrank(sender);
    stkMngr.depositToken(amount);
    vm.stopPrank();
  }
  function _withdrawToken(address sender, address receipient, uint256 amount) internal {
    vm.startPrank(sender);
    stkMngr.withdrawTokenTo(receipient, amount);
    vm.stopPrank();
  }
  function _transferTo(address sender, address recipient, uint256 amount) public {
    vm.startPrank(sender);
    IERC20(hx).transfer(recipient, amount);
    vm.stopPrank();
  }
  function testDeposits() public {
    _depositToken(vm.addr(1), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), 0);
    assertEq(IERC20(hx).balanceOf(address(stkMngr)), startingBalance);
    assertEq(stkMngr.withdrawableBalanceOf(vm.addr(1)), startingBalance);
    assertEq(stkMngr.tokensAttributed(), startingBalance);
    _depositToken(vm.addr(2), startingBalance);
    // balances are tracked independently for each sendeer
    assertEq(stkMngr.withdrawableBalanceOf(vm.addr(1)), startingBalance);
    assertEq(stkMngr.withdrawableBalanceOf(vm.addr(2)), startingBalance);
    // a global amount is collected as well
    assertEq(stkMngr.tokensAttributed(), startingBalance * 2);
  }
  function testWithdrawalLimits() public {
    // alice deposits
    _depositToken(vm.addr(1), startingBalance);
    // bob cannot take alice's deposits
    vm.expectRevert(abi.encodeWithSelector(
      StakeManager.NotEnoughFunding.selector,
      0, 1
    ));
    _withdrawToken(vm.addr(2), vm.addr(1), 1);
    // alice cannot take more than deposited
    vm.expectRevert(abi.encodeWithSelector(
      StakeManager.NotEnoughFunding.selector,
      startingBalance, startingBalance + 1
    ));
    _withdrawToken(vm.addr(1), vm.addr(1), startingBalance + 1);
    _withdrawToken(vm.addr(1), vm.addr(1), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    // alice still cannot take more than deposited
    vm.expectRevert(abi.encodeWithSelector(
      StakeManager.NotEnoughFunding.selector,
      startingBalance / 2, startingBalance
    ));
    _withdrawToken(vm.addr(1), vm.addr(1), startingBalance);
    // using 0 withdraws the remaining balance
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    _withdrawToken(vm.addr(1), vm.addr(1), 0);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
  }
  function testWithdrawTo() public {
    _depositToken(vm.addr(1), startingBalance);
    // alice can withdraw her tokens
    _withdrawToken(vm.addr(1), vm.addr(1), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance / 2);
    assertEq(stkMngr.withdrawableBalanceOf(vm.addr(1)), startingBalance / 2);
    // and can send withdrawable tokens to bob through the contract
    assertEq(IERC20(hx).balanceOf(vm.addr(2)), startingBalance);
    _withdrawToken(vm.addr(1), vm.addr(2), startingBalance / 2);
    assertEq(IERC20(hx).balanceOf(vm.addr(2)), startingBalance * 3 / 2);
    _transferTo(vm.addr(2), vm.addr(1), startingBalance / 2);
  }
}
