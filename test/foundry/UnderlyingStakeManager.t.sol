// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { TestStakeManager } from "./TestStakeManager.t.sol";
import { UnderlyingStakeManager } from "contracts/UnderlyingStakeManager.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { MulticallExtension } from "contracts/MulticallExtension.sol";

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
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), startingBalance);
    _withdrawToken(vm.addr(1), payable(vm.addr(1)), startingBalance);
    // using 0 withdraws the remaining balance
    _depositTokenFrom(vm.addr(1), startingBalance);
    assertEq(IERC20(hx).balanceOf(vm.addr(1)), 0);
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
    MulticallExtension(stkMngr).multicall(calls, false);
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
