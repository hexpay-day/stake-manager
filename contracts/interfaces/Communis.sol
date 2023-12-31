// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { ERC20 } from "solmate/src/tokens/ERC20.sol";

abstract contract Communis is ERC20 {
  struct Stake {
    uint256 stakeId;
    uint256 stakedHearts;
    uint256 stakeShares;
    uint256 lockedDay;
    uint256 stakedDays;
    uint256 unlockedDay;
  }

  struct PayoutResponse {
    uint256 recalculatedStakeShares;
    uint256 stakesOriginalShareRate;
    uint256 maxPayout;
  }

  function mintEndBonus(uint256 stakeIndex, uint256 stakeId, address referrer, uint256 stakeAmount) external virtual;
  function mintGoodAccountingBonus(address stakeOwner, uint256 stakeIndex, uint256 stakeId) external virtual;
  function mintStakeBonus() external virtual;
  function mintStartBonus(
    uint256 stakeIndex, uint256 stakeId,
    bool applyRestakeBonus, address referrer, uint256 stakeAmount
  ) external virtual;
  function stakeIdGoodAccountingBonusPayout(uint256 stakeId) external virtual view returns(uint256);
  function stakeIdEndBonusPayout(uint256 stakeId) external virtual view returns(uint256);
  function stakeIdStartBonusPayout(uint256 stakeId) external virtual view returns(uint256);
  function addressStakedCodeak(address owner) external virtual view returns(uint256);

  function withdrawStakedCodeak(uint256 withdrawAmount) external virtual;
  function getPayout(Stake memory s) external virtual pure returns (PayoutResponse memory pr);
  function getStartBonusPayout(
    uint256 stakedDays,
    uint256 lockedDay,
    uint256 maxPayout,
    uint256 stakesOriginalShareRate,
    uint256 currentDay,
    uint256 globalShareRate,
    bool applyRestakeBonus
  ) external virtual pure returns (uint256 payout);
}
