// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import { IPublicEndStakeable } from "../interfaces/IPublicEndStakeable.sol";
import { IHEX } from "../interfaces/IHEX.sol";
import { IHedron } from "../interfaces/IHedron.sol";
import { Utils } from "../Utils.sol";
import { UnderlyingStakeable } from "../UnderlyingStakeable.sol";

contract MockPerpetual is IPublicEndStakeable, Utils {
  function startStakeHEX() external {
    uint256 lockedDays = 1;
    STAKE_END_DAY = UnderlyingStakeable(TARGET).currentDay() + lockedDays;
    IHEX(TARGET).stakeStart(IHEX(TARGET).balanceOf(address(this)), lockedDays);
  }
  uint256 public STAKE_END_DAY = 0;
  bool public STAKE_IS_ACTIVE = true;
  uint256 public currentPeriod = 1;
  function mintHedron(uint256 stakeIndex, uint40 stakeIdParam) external {
    IHedron(HEDRON).mintNative(stakeIndex, stakeIdParam);
  }
  function endStakeHEX(uint256 stakeIndex, uint40 stakeIdParam) external {
    // these resets are handled by stake restarts
    // internally managed by perpetual contract
    STAKE_IS_ACTIVE = false;
    this.mintHedron(stakeIndex, stakeIdParam);
    IHEX(TARGET).stakeEnd(stakeIndex, stakeIdParam);
    currentPeriod++;
  }
  function getCurrentPeriod() external view returns (uint256) {
    return currentPeriod;
  }
}
