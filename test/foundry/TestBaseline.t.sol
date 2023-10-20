// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { TestStakeManager } from "./TestStakeManager.t.sol";
import { StakeManager } from "contracts/StakeManager.sol";

contract TestBaselineEnd1 is TestStakeManager {
  function setUp() override virtual public {
    super.setUp();
    _directStakeStart(vm.addr(1), startingBalance / 10, _days()); // 0
    _managedStakeStart(vm.addr(1), startingBalance / 10, _days()); // 1
    uint256 settings = stkMngr.stakeIdToSettings(nextStakeId + 1);
    settings = (settings >> 32 << 32) | uint16(settings);
    _updateSettings(vm.addr(1), nextStakeId + 1, settings);
    _managedStakeStart(vm.addr(2), startingBalance / 10, _days()); // 2
    _managedStakeStart(vm.addr(3), startingBalance / 10, _days()); // 3
    _managedStakeStart(vm.addr(3), startingBalance / 10, _days()); // 4
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days()); // 5
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days()); // 6
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days()); // 7
    _stakeStart(vm.addr(5), startingBalance / 10, _days()); // 8
    _stakeStart(vm.addr(5), startingBalance / 10, _days()); // 9
    _stakeStart(vm.addr(5), startingBalance / 10, _days()); // 10
    _stakeStart(vm.addr(6), startingBalance / 10, _days()); // 11
    _stakeStart(vm.addr(6), startingBalance / 10, _days()); // 12
    _stakeStart(vm.addr(7), startingBalance / 10, _days()); // 13
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 14
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 15
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 16
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 17
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 18
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 19
    _stakeStart(vm.addr(8), startingBalance / 10, _days()); // 20
    // this line is added to make gas estimations comparable
    _directStakeStart(vm.addr(1), startingBalance / 10, _days());
    _moveDays(vm.addr(5), _days() + 1);
  }
  function _days() internal virtual pure returns(uint256) {
    return 1;
  }
  function testBaselineManagedStart() public virtual {
    _managedStakeStart(vm.addr(1), startingBalance / 10, _days());
  }
  function testBaselineDirectEnd() public virtual {
    _directStakeEnd(vm.addr(1), 0, nextStakeId);
  }
  function testBaselineDirectStart() public virtual {
    // does not take into account 2 txs
    _directStakeStart(vm.addr(1), startingBalance / 10, _days());
  }
  function testBaselineManagedEnd() public virtual {
    _stakeEndByConsent(vm.addr(1), nextStakeId + 1);
  }
  function testBaselineManagedRestart1() public virtual {
    _stakeEndByConsent(vm.addr(2), nextStakeId + 2);
  }
  function testBaselineManagedRestart2() public virtual {
    uint256[] memory list = new uint256[](2);
    list[0] = nextStakeId + 3;
    list[1] = nextStakeId + 4;
    _stakeEndByConsentForMany(vm.addr(3), list);
  }
  function testBaselineManagedRestart3() public virtual {
    uint256[] memory list = new uint256[](3);
    list[0] = nextStakeId + 5;
    list[1] = nextStakeId + 6;
    list[2] = nextStakeId + 7;
    _stakeEndByConsentForMany(vm.addr(4), list);
  }
  function testBaselineSelfManagedRestart3() public virtual {
    uint256[] memory list = new uint256[](3);
    list[0] = nextStakeId + 8;
    list[1] = nextStakeId + 9;
    list[2] = nextStakeId + 10;
    _stakeRestartManyById(vm.addr(5), list);
  }
  function testBaselineSelfManagedRestart7() public virtual {
    uint256[] memory list = new uint256[](7);
    list[0] = nextStakeId + 14;
    list[1] = nextStakeId + 15;
    list[2] = nextStakeId + 16;
    list[3] = nextStakeId + 17;
    list[4] = nextStakeId + 18;
    list[5] = nextStakeId + 19;
    list[6] = nextStakeId + 20;
    _stakeRestartManyById(vm.addr(8), list);
  }
  function testBaselineSelfManagedRestart2() public virtual {
    uint256[] memory list = new uint256[](2);
    list[0] = nextStakeId + 11;
    list[1] = nextStakeId + 12;
    _stakeRestartManyById(vm.addr(6), list);
  }
  function testBaselineSelfManagedRestart1() public virtual {
    _stakeRestartById(vm.addr(7), nextStakeId + 13);
  }
}

contract TestBaselineEnd90 is TestBaselineEnd1 {
  function _days() internal override virtual pure returns(uint256) {
    return 90;
  }
}

contract TestBaselineEnd369 is TestBaselineEnd1 {
  function _days() internal override virtual pure returns(uint256) {
    return 369;
  }
}

contract TestBaselineEnd3690 is TestBaselineEnd1 {
  function _days() internal override virtual pure returns(uint256) {
    return 3690;
  }
}
