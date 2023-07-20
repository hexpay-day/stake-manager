// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./TestStakeManager.t.sol";

contract TestBaselineEnd1 is TestStakeManager {
  function setUp() override virtual public {
    super.setUp();
    _directStakeStart(vm.addr(1), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(1), startingBalance / 10, _days());
    StakeManager.Settings memory settings = stkMngr.stakeIdSettings(nextStakeId + 1);
    settings.newStakeDaysMethod = 0;
    _updateSettings(vm.addr(1), nextStakeId + 1, settings);
    _managedStakeStart(vm.addr(2), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(3), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(3), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days());
    _managedStakeStart(vm.addr(4), startingBalance / 10, _days());
    // this line is added to make gas estimations comparable
    _directStakeStart(vm.addr(1), startingBalance / 10, _days());
    _moveDays(vm.addr(5), _days() + 1);
  }
  function _days() internal virtual pure returns(uint256) {
    return 1;
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
    _stakeEndByConsentForMany(vm.addr(2), list);
  }
  function testBaselineManagedRestart3() public virtual {
    uint256[] memory list = new uint256[](3);
    list[0] = nextStakeId + 5;
    list[1] = nextStakeId + 6;
    list[2] = nextStakeId + 7;
    _stakeEndByConsentForMany(vm.addr(2), list);
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
