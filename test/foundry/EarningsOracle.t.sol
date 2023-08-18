// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.16;

import { Test } from "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "contracts/EarningsOracle.sol";

contract TestEarningsOracle is Test {
  EarningsOracle public immutable eo;
  EarningsOracle public immutable eoMiss;
  constructor() {
    eo = new EarningsOracle(1, 0);
    eoMiss = new EarningsOracle(0, 0);
  }
  function testStoreDay() public {
    eo.storeDay(0);
  }
}
