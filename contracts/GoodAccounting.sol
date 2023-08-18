// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.8.18;

import { IHEX } from "./IHEX.sol";
import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { Bank } from "./Bank.sol";
import { StakeInfo } from "./StakeInfo.sol";
import { Tipper } from "./Tipper.sol";

abstract contract GoodAccounting is StakeInfo, Tipper {
  /**
   * check that the provided stake can be ended and end it
   * @param stakeId the stake id to end as custodied by this contract
   */
  function checkStakeGoodAccounting(uint256 stakeId) external {
    _checkStakeGoodAccounting({
      staker: address(this),
      index: _stakeIdToIndex(stakeId),
      stakeId: stakeId
    });
  }
  /**
   * check that the stake can be good accounted, and execute the method if it will not fail
   * @param staker the custodian of the provided stake
   * @param index the index of the stake
   * @param stakeId the stake id of the stake
   */
  function checkStakeGoodAccountingFor(address staker, uint256 index, uint256 stakeId) external {
    _checkStakeGoodAccounting({
      staker: staker,
      index: index,
      stakeId: stakeId
    });
  }
  /**
   * run the appropriate checks if the stake is good accountable.
   * return 0 if it can be good accounted
   * return other numbers for those failed conditions
   * @param staker the custodian of the provided stake
   * @param index the index of the stake
   * @param stakeId the stake id of the stake
   */
  function isGoodAccountable(
    address staker,
    uint256 index,
    uint256 stakeId
  ) external view returns(GoodAccountingStatus) {
    return _isGoodAccountable({
      staker: staker,
      index: index,
      stakeId: stakeId
    });
  }
  function isStakeIdGoodAccountable(uint256 stakeId) external view returns(GoodAccountingStatus) {
    return _isGoodAccountable({
      staker: address(this),
      index: _stakeIdToIndex({
        stakeId: stakeId
      }),
      stakeId: stakeId
    });
  }
  enum GoodAccountingStatus {
    READY,
    ENDED,
    EARLY,
    MISMATCH,
    MISCOUNT
  }
  function _isGoodAccountable(
    address staker,
    uint256 index,
    uint256 stakeId
  ) internal view returns(GoodAccountingStatus) {
    uint256 count = IHEX(TARGET).stakeCount(staker);
    if (index >= count) {
      return GoodAccountingStatus.MISCOUNT;
    }
    StakeStore memory stake = _getStake({
      custodian: staker,
      index: index
    });
    if (stake.stakeId != stakeId) {
      // the stake id does not match
      return GoodAccountingStatus.MISMATCH;
    }
    if (_isEarlyEnding({
      lockedDay: stake.lockedDay,
      stakedDays: stake.stakedDays,
      targetDay: IHEX(TARGET).currentDay()
    })) {
      // return if it is too early to run good accounting
      return GoodAccountingStatus.EARLY;
    }
    if (stake.unlockedDay > 0) {
      // the stake has already been ended
      return GoodAccountingStatus.ENDED;
    }
    return GoodAccountingStatus.READY;
  }
  function _checkStakeGoodAccounting(address staker, uint256 index, uint256 stakeId) internal {
    if (_isGoodAccountable({
      staker: staker,
      index: index,
      stakeId: stakeId
    }) == GoodAccountingStatus.READY) {
      _stakeGoodAccounting({
        stakerAddr: staker,
        stakeIndex: index,
        stakeIdParam: stakeId
      });
    }
  }
}
