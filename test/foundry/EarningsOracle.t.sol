// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { Test } from "forge-std/Test.sol";
import { EarningsOracle } from "contracts/EarningsOracle.sol";
import { Utils } from 'contracts/Utils.sol';
import { IHEX } from "contracts/interfaces/IHEX.sol";

contract TestEarningsOracle is Test {
  EarningsOracle public immutable eo;
  EarningsOracle public immutable eoMiss;
  IHEX public hx = IHEX(0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39);
  constructor() {
    eo = new EarningsOracle(1, 0);
    eoMiss = new EarningsOracle(0, 0);
  }
  function test_testStoreDay() public {
    eo.storeDay(0);
  }
  function test_storeDayEoMiss() public {
    eoMiss.storeDay(0);
    vm.expectRevert(abi.encodeWithSelector(Utils.NotAllowed.selector));
    eoMiss.storeDay(1);
  }
  function testFuzz_catchUpDays(uint16 increment) public {
    eo.catchUpDays(increment);
  }
  /// forge-config: default.invariant.runs = 10
  /// forge-config: default.invariant.depth = 5
  function invariant_neverAtOrBeyondCurrentDay() public {
    assertLe(eo.totalsCount(), hx.currentDay());
  }
}
