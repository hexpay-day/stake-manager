// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import { PublicEndStakeable } from "../interfaces/PublicEndStakeable.sol";
import { HEX } from "../interfaces/HEX.sol";
import { Hedron } from "../interfaces/Hedron.sol";
import { UnderlyingStakeable } from "../UnderlyingStakeable.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";

contract MockPerpetual is PublicEndStakeable {
  address internal constant TARGET = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  address internal constant HEDRON = 0x3819f64f282bf135d62168C1e513280dAF905e06;
  function startStakeHEX() external {
    uint256 lockedDays = 1;
    _endStaker = address(0);
    _STAKE_END_DAY = UnderlyingStakeable(TARGET).currentDay() + lockedDays;
    HEX(TARGET).stakeStart(ERC20(TARGET).balanceOf(address(this)), lockedDays);
  }
  uint256 internal _STAKE_END_DAY = 0;
  function STAKE_END_DAY() external override view returns(uint256) {
    return _STAKE_END_DAY;
  }
  bool internal _STAKE_IS_ACTIVE = true;
  function STAKE_IS_ACTIVE() external override view returns(bool) {
    return _STAKE_IS_ACTIVE;
  }
  uint256 internal currentPeriod = 1;
  address internal _endStaker;
  function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external override {
    Hedron(HEDRON).mintNative(stakeIndex, stakeIdParam);
  }
  function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external override {
    // these resets are handled by stake restarts
    // internally managed by perpetual contract
    _STAKE_IS_ACTIVE = false;
    this.mintHedron(stakeIndex, stakeIdParam);
    HEX(TARGET).stakeEnd(stakeIndex, stakeIdParam);
    _endStaker = msg.sender;
    currentPeriod++;
  }
  function getCurrentPeriod() external override view returns (uint256) {
    return currentPeriod;
  }
  function getEndStaker() external override view returns(address) {
    return _endStaker;
  }
}
