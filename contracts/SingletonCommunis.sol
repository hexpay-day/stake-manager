// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { Communis } from "./Communis.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { StakeEnder } from "./StakeEnder.sol";

contract SingletonCommunis is StakeEnder {
  enum CommunisMintPortion {
    START,
    GOOD_ACCOUNT,
    END,
    BONUS
  }
  /**
   * mint comm for staking
   * @dev this function only works for non hsi's since stake is owned by other contract in that case
   * @param portion an enum corresponding to a method to be called for minting $COMM
   * @param stakeId the stake id to target - first call must be run by owner
   * @param referrer the referrer of the mint
   * @param stakeAmount a uint255 where the first (left most) bit is a flag for apply restake bonus when portion = START
   */
  function mintCommunis(CommunisMintPortion portion, uint256 stakeId, address referrer, uint256 stakeAmount) external {
    uint256 bal = ERC20(COMM).balanceOf(address(this));
    if (portion < CommunisMintPortion.END) {
      uint256 settings = stakeIdToSettings[stakeId];
      if (portion == CommunisMintPortion.START) {
        // start must be run by owner of the stake
        if (Communis(COMM).stakeIdStartBonusPayout(stakeId) == ZERO) {
          if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
            (uint256 index, address staker) = _stakeIdToInfo(stakeId);
            if (msg.sender == staker) {
              Communis(COMM).mintStartBonus(
                index, stakeId,
                stakeAmount >> MAX_UINT_8 == ONE,
                referrer,
                (stakeAmount << TWO) >> TWO
              );
              bal = ERC20(COMM).balanceOf(address(this)) - bal;
              _attributeFunds({
                settings: settings,
                token: COMM,
                staker: staker,
                amount: bal
              });
            }
          }
        }
      } else {
        // good account
        (uint256 index, address staker) = _stakeIdToInfo(stakeId);
        if (_isGoodAccountable({
          staker: staker,
          index: index,
          stakeId: stakeId
        }) == GoodAccountingStatus.READY) {
          if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
            // nested if statements ensure that this call will not revert when called
            Communis(COMM).mintGoodAccountingBonus(staker, index, stakeId);
            bal = ERC20(COMM).balanceOf(address(this)) - bal;
            _attributeFunds({
              settings: settings,
              token: COMM,
              staker: staker,
              amount: bal
            });
          }
        }
      }
    } else if (portion == CommunisMintPortion.END) {
      // end
      // if this branch is being called, then it generally means that this is
      // occurring outside of the rush of end stakes - so we do fewer checks here
      if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
        (uint256 index, address staker) = _stakeIdToInfo(stakeId);
        if (msg.sender == staker) {
          uint256 settings = stakeIdToSettings[stakeId];
          Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount);
          bal = ERC20(COMM).balanceOf(address(this)) - bal;
          _attributeFunds({
            settings: settings,
            token: COMM,
            staker: staker,
            amount: bal
          });
        }
      }
    } else {
      // bonus - generally we are going to assume that this
      // is rarely if ever going to be called so we are not going to do checks
      Communis(COMM).mintStakeBonus();
      if (referrer != address(0)) {
        bal = ERC20(COMM).balanceOf(address(this)) - bal;
        _addToTokenWithdrawable({
          token: COMM,
          to: referrer,
          amount: bal
        });
      }
    }
  }

  mapping(uint256 stakeId => uint256 amount) public futureStakeEndCommunisAmount;

  function setFutureStakeEndCommunisAmount(uint256 stakeId, uint256 stakeAmount) external {
    (, address staker) = _stakeIdToInfo(stakeId);
    if (staker != msg.sender) {
      revert NotAllowed();
    }
    futureStakeEndCommunisAmount[stakeId] = stakeAmount;
  }
  /**
   * mint end bonus before ending a hex stake
   * @param index the index of the stake to find it in the stake list
   * @param staker the staker that will receive funds
   * @param referrer the referrer (tipTo) address
   * @param stake the in memory stake to use
   */
  function _communisStakeEndBonus(
    uint256 settings,
    uint256 index, address staker, address referrer,
    UnderlyingStakeable.StakeStore memory stake
  ) internal override {
    uint256 stakeId = stake.stakeId;
    if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
      uint256 stakeAmount = futureStakeEndCommunisAmount[stakeId];
      if (stakeAmount > ZERO) {
        futureStakeEndCommunisAmount[stakeId] = ZERO;
        Communis.PayoutResponse memory res = Communis(COMM).getPayout(Communis.Stake(
          stakeId,
          stake.stakedHearts,
          stake.stakeShares,
          stake.lockedDay,
          stake.stakedDays,
          stake.unlockedDay
        ));
        if (res.maxPayout < stakeAmount) {
          stakeAmount = res.maxPayout;
        }
      }
      uint256 bal = ERC20(COMM).balanceOf(address(this));
      try Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount) {} catch {
        // nothing if failure occurs
        return;
      }
      bal = ERC20(COMM).balanceOf(address(this)) - bal;
      _attributeFunds({
        settings: settings,
        token: COMM,
        staker: staker,
        amount: bal
      });
    }
  }
}