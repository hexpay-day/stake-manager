// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { IHEX } from  "./interfaces/IHEX.sol";
import { Communis } from "./Communis.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { StakeEnder } from "./StakeEnder.sol";

contract SingletonCommunis is StakeEnder {
  enum CommunisMintPortion {
    START,
    GOOD_ACCOUNT,
    END
  }

  uint256 public distributableCommunisStakeBonus = 0;
  mapping(uint256 stakeId => address formerOwner) public formerStakeOwner;
  mapping(uint256 stakeId => uint256 payoutInfo) public stakeIdCommunisPayoutInfo;
  uint256 constant internal NINETY_ONE = 91;
  uint256 constant internal ONE_TWENTY = 120;

  /**
   * mint comm for staking
   * @dev this function only works for non hsi's since stake is owned by other contract in that case
   * @param portion an enum corresponding to a method to be called for minting $COMM
   * @param stakeId the stake id to target - first call must be run by owner
   * @param referrer the referrer of the mint
   * @param stakeAmount a uint255 where the first (left most) bit is a flag for apply restake bonus when portion = START
   */
  function mintCommunis(CommunisMintPortion portion, uint256 stakeId, address referrer, uint256 stakeAmount) external payable {
    (uint256 bal, ) = _mintStakeBonus();
    if (portion < CommunisMintPortion.END) {
      uint256 settings = stakeIdToSettings[stakeId];
      if (portion == CommunisMintPortion.START) {
        // start must be run by owner of the stake
        if (Communis(COMM).stakeIdStartBonusPayout(stakeId) == ZERO) {
          if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
            (uint256 index, address staker) = _stakeIdToInfo(stakeId);
            if (msg.sender == staker) {
              unchecked {
                bool applyRestakeBonus = (stakeAmount >> MAX_UINT_8) == ONE;
                stakeAmount = uint256(uint120(stakeAmount));
                Communis(COMM).mintStartBonus(
                  index, stakeId,
                  applyRestakeBonus,
                  referrer,
                  stakeAmount
                );
                stakeIdCommunisPayoutInfo[stakeId] += stakeAmount;

                _attributeFunds({
                  settings: settings,
                  token: COMM,
                  staker: staker,
                  amount: ERC20(COMM).balanceOf(address(this)) - bal
                });
              }
            }
          }
        }
      } else {
        // good account
        uint256 index = _stakeIdToIndex(stakeId);
        if (_isGoodAccountable({
          staker: address(this),
          index: index,
          stakeId: stakeId
        }) == GoodAccountingStatus.READY) {
          Communis(COMM).mintGoodAccountingBonus(address(this), index, stakeId);
          unchecked {
            _attributeCommunis({
              withdraw: stakeAmount == ONE,
              to: referrer,
              amount: ERC20(COMM).balanceOf(address(this)) - bal
            });
          }
        }
      }
    } else {
      // end
      // if this branch is being called, then it generally means that this is
      // occurring outside of the rush of end stakes - so we do fewer checks here
      if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
        (uint256 index, address staker) = _stakeIdToInfo(stakeId);
        if (msg.sender == staker) {
          uint256 settings = stakeIdToSettings[stakeId];
          formerStakeOwner[stakeId] = staker;

          Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount);
          // stakeAmount must be at least half of stakeIdEndBonusPayout.
          // Luckily stakeIdEndBonusPayout represents pr.maxPayout - stakeIdStartBonusPayout[stakeID] (from com.sol)
          uint256 stakeIdEndBonusPayoutDebt = Communis(COMM).stakeIdEndBonusPayout(stakeId) / TWO;
          if(stakeAmount >= stakeIdEndBonusPayoutDebt) {
            unchecked {
              stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
                nextPayoutDay: IHEX(TARGET).currentDay() + NINETY_ONE,
                endBonusPayoutDebt: stakeIdEndBonusPayoutDebt,
                stakeAmount: uint256(uint120(stakeIdCommunisPayoutInfo[stakeId]) + uint256(uint120(stakeAmount)))
              });
              _attributeFunds({
                settings: settings,
                token: COMM,
                staker: staker,
                amount: ERC20(COMM).balanceOf(address(this)) - bal
              });
            }
          }
          else {
              revert NotAllowed();
          }
        }
      }
    }
  }

  function _encodePayoutInfo(uint256 nextPayoutDay, uint256 endBonusPayoutDebt, uint256 stakeAmount) internal pure returns(uint256) {
    unchecked {
      return (
        nextPayoutDay << 240
        | uint256(uint120(endBonusPayoutDebt)) << ONE_TWENTY
        | uint256(uint120(stakeAmount))
      );
    }
  }

  /**
   * sets a stake amount to use in the future - when the stake may be ended by others
   * @param stakeId the stake id to target
   * @param futureEndStakeAmount the 1 offset amount to stake. 0 = do not stake, 1 = stake it all, n - 1 are the remaining options
   */
  function setFutureStakeEndCommunisAmount(uint256 stakeId, uint256 futureEndStakeAmount) external payable {
    // flag to signal that minting has not yet occurred for this stake id (when 0)
    if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) { // must be a stake that has not received end bonus payout
      (, address staker) = _stakeIdToInfo(stakeId); // must be an unended stake
      if (staker != msg.sender) { // permissioned call
        revert NotAllowed();
      }
      uint256 current = stakeIdCommunisPayoutInfo[stakeId];
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: uint16(current >> 240),
        endBonusPayoutDebt: futureEndStakeAmount, // 0 means do not stake, 1 means stake it all (1 offset)
        stakeAmount: uint120(current)
      });
    }
  }
  function _maxPayout(UnderlyingStakeable.StakeStore memory stake) internal pure returns(uint256 maxPayout) {
    return Communis(COMM).getPayout(Communis.Stake(
      stake.stakeId,
      stake.stakedHearts,
      stake.stakeShares,
      stake.lockedDay,
      stake.stakedDays,
      stake.unlockedDay
    )).maxPayout;
  }
  /**
   * mint end bonus before ending a hex stake
   * @param index the index of the stake to find it in the stake list
   * @param staker the staker that will receive funds
   * @param referrer the referrer (tipTo) address
   * @param stake the in memory stake to use
   */
  function _communisStakeEndBonus(
    uint256 settings, uint256 today,
    uint256 index, address staker, address referrer,
    UnderlyingStakeable.StakeStore memory stake
  ) internal override {
    uint256 stakeId = stake.stakeId;
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
    uint256 stakeAmount = uint120(payoutInfo >> ONE_TWENTY);
    (uint256 bal, ) = _mintStakeBonus();
    if (stakeAmount > ZERO) {
      unchecked {
        stakeAmount = _clamp({
          // this is where the 1 offset comes into play: zero means match max value
          amount: stakeAmount - ONE,
          // can't underflow, but if it were to, you're staking it all :)
          max: (_maxPayout(stake) - Communis(COMM).stakeIdStartBonusPayout(stakeId)) // / TWO
        });
      }
    }
    if (referrer == address(0)) {
      referrer = address(this);
    }
    formerStakeOwner[stakeId] = staker;
    try Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount) {
    } catch {
      // nothing if failure occurs
      return;
    }

    unchecked {
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: today + NINETY_ONE,
        endBonusPayoutDebt: Communis(COMM).stakeIdEndBonusPayout(stakeId) / TWO,
        stakeAmount: uint256(uint120(payoutInfo)) + stakeAmount
      });

      _attributeFunds({
        settings: settings,
        token: COMM,
        staker: staker,
        amount: ERC20(COMM).balanceOf(address(this)) - bal
      });
    }
  }

  function _verifyOnlyStaker(uint256 stakeId) internal view returns(address staker) {
    staker = formerStakeOwner[stakeId];
    if (staker != msg.sender) {
      // might not yet be set - if the stake has not yet ended
      staker = _stakeIdToOwner(stakeId);
      if (staker != msg.sender) {
        revert NotAllowed();
      }
    }
  }

  function withdrawAmountByStakeId(uint256 withdrawAmount, uint256 stakeId, bool withdraw) external payable {
    address staker = _verifyOnlyStaker(stakeId);
    // we hold the staked amount on this contract in order to break it up
    // between stakes - that way, everyone can get out what they put in
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
    unchecked {
      uint256 stakedAmount = uint120(payoutInfo);
      if (withdrawAmount > stakedAmount) {
        revert NotAllowed();
      }

      uint256 stakedAmountAfterWithdraw = (stakedAmount - withdrawAmount);
      if (stakedAmountAfterWithdraw < uint120(payoutInfo >> ONE_TWENTY)) {
        revert NotAllowed();
      }

      Communis(COMM).withdrawStakedCodeak(withdrawAmount);
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: uint16(payoutInfo >> 240),
        endBonusPayout: uint120(payoutInfo >> ONE_TWENTY),
        stakeAmount: stakedAmountAfterWithdraw
      });
      _attributeCommunis({
        withdraw: withdraw,
        to: staker,
        amount: withdrawAmount
      });
    }
  }

  function mintStakeBonus() external payable {
    _mintStakeBonus();
  }

  /**
   * claims stake bonus for everyone staking through stake manager contract
   * @return balance the amount of comm that this contract holds
   * @return distributableBonus the total bonus distributed to all stakers in this contract
   */
  function _mintStakeBonus() internal returns(uint256 balance, uint256 distributableBonus) {
    uint256 bal = ERC20(COMM).balanceOf(address(this));

    try Communis(COMM).mintStakeBonus() {
      balance = ERC20(COMM).balanceOf(address(this));
      distributableBonus = distributableCommunisStakeBonus + (balance - bal);
      distributableCommunisStakeBonus = distributableBonus;
    } catch {
      distributableBonus = distributableCommunisStakeBonus;
      balance = bal;
    }
  }

  function _attributeCommunis(bool withdraw, address to, uint256 amount) internal {
    if (amount > ZERO) {
      if (withdraw) {
        _withdrawTokenTo({
          token: COMM,
          to: to,
          amount: amount
        });
      } else {
        _addToTokenWithdrawable({
          token: COMM,
          to: to,
          amount: amount
        });
      }
    }
  }

  function distributeStakeBonusByStakeId(uint256 stakeId, bool withdraw) external payable returns(uint256 payout) {
    address staker = _verifyOnlyStaker(stakeId);
    (, uint256 distributableBonus) = _mintStakeBonus(); // assure anything claimable for the stake manager is claimed (for everone)

    uint256 currentDay = IHEX(TARGET).currentDay();
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];

    uint256 stakeManagerStakedAmount = Communis(COMM).addressStakedCodeak(address(this));

    unchecked {
      uint256 stakedAmount = uint256(uint120(payoutInfo));
      if (stakedAmount == ZERO || stakeManagerStakedAmount == ZERO) {
        revert NotAllowed();
      }
      uint256 nextPayoutDay = uint16(payoutInfo >> 240);
      if (nextPayoutDay > currentDay) {
        revert NotAllowed();
      }

      // This looks at how much a given stakeId is currently contributing to the total amount staked in the stake manager.
      // contributionPercentage goes up and down with stakedAmount given fixed stakeManagerStakedAmount
      // contributionPercentage goes up and down with stakeManagerStakedAmount given fixed stakedAmount
      //    - If others reduce the stakeManagerStakedAmount by withdrawing their
      //      staked COM (and not running distributeStakeBonusByStakeId for themself)
      //      contributionPercentage goes up and distributableCommunisStakeBonus simply gets redistributed accordingly.

      uint256 numberOfPayouts = ((currentDay - nextPayoutDay) / NINETY_ONE) + ONE;

      payout = ((
        distributableBonus * (stakedAmount * 100_000)
      )) / (100_000 * stakeManagerStakedAmount);

      distributableCommunisStakeBonus = (distributableBonus - payout);
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: nextPayoutDay + (numberOfPayouts * NINETY_ONE),
        endBonusPayoutDebt: uint120(payoutInfo >> ONE_TWENTY),
        stakeAmount: stakedAmount
      });
    }
    _attributeCommunis({
      withdraw: withdraw,
      to: staker,
      amount: payout
    });
  }
}
