// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import { UnderlyingStakeable } from "./UnderlyingStakeable.sol";
import { Communis } from "./interfaces/Communis.sol";
import { ERC20 } from "solmate/src/tokens/ERC20.sol";
import { HEX } from "./interfaces/HEX.sol";
import { StakeEnder } from "./StakeEnder.sol";

contract SingletonCommunis is StakeEnder {
  enum CommunisMintPortion {
    START,
    GOOD_ACCOUNT,
    END
  }

  uint256 public distributableCommunisStakeBonus;
  mapping(uint256 stakeId => address formerOwner) public formerStakeOwner;
  mapping(uint256 stakeId => uint256 payoutInfo) public stakeIdCommunisPayoutInfo;
  uint256 constant internal NINETY_ONE = 91;
  uint256 constant internal ONE_TWENTY = 120;
  uint256 constant internal TWO_FOURTY = 240;

  /**
   * mint comm for staking
   * @dev this function only works for non hsi's since stake is owned by other contract in that case
   * @param portion an enum corresponding to a method to be called for minting $COMM
   * @param stakeId the stake id to target - first call must be run by owner
   * @param referrer the referrer of the mint
   * @param stakeAmount the amount of the start bonus to stake. the left-most bit designated as a boolean for applying restake bonus
   * @notice during stake good accounting, stakeAmount is used as a boolean 1 = withdraw, anything else = custody in contract
   */
  function mintCommunis(CommunisMintPortion portion, uint256 stakeId, address referrer, uint256 stakeAmount) external payable {
    _mintStakeBonus();
    if (portion < CommunisMintPortion.END) {
      uint256 settings = stakeIdToSettings[stakeId];
      if (portion == CommunisMintPortion.START) {
        // start must be run by owner of the stake
        if (Communis(COMM).stakeIdEndBonusPayout(stakeId) == ZERO) {
          (uint256 index, address staker) = _stakeIdToInfo(stakeId);
          if (msg.sender != staker) {
            revert NotAllowed();
          }
          uint256 bal = ERC20(COMM).balanceOf(address(this));
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
      } else {
        // good account
        uint256 index = _stakeIdToIndex(stakeId);
        if (_isGoodAccountable({
          staker: address(this),
          index: index,
          stakeId: stakeId
        }) == GoodAccountingStatus.READY) {
          uint256 bal = ERC20(COMM).balanceOf(address(this));
          Communis(COMM).mintGoodAccountingBonus(address(this), index, stakeId);
          unchecked {
            _attributeFunds({
              // 16 always yields true for the 4th index
              settings: stakeAmount == ONE ? SIXTEEN : ZERO,
              staker: referrer,
              token: COMM,
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
        if (msg.sender != staker) {
          revert NotAllowed();
        }
        uint256 settings = stakeIdToSettings[stakeId];
        formerStakeOwner[stakeId] = staker;
        UnderlyingStakeable.StakeStore memory stake = _getStake(address(this), index);
        uint256 payout;
        (stakeAmount, referrer, payout) = _stakeAmountFromInputs({
          requestedStakeAmount: stakeAmount,
          referrer: referrer,
          stake: stake
        });
        Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount);
        // stakeAmount must be at least half of stakeIdEndBonusPayout.
        // Luckily stakeIdEndBonusPayout represents pr.maxPayout - stakeIdStartBonusPayout[stakeID] (from com.sol)
        unchecked {
          stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
            nextPayoutDay: HEX(TARGET).currentDay() + NINETY_ONE,
            endBonusPayoutDebt: payout / TWO,
            stakeAmount: uint256(uint120(stakeIdCommunisPayoutInfo[stakeId])) + stakeAmount
          });
          _attributeFunds({
            settings: settings,
            token: COMM,
            staker: staker,
            amount: payout - stakeAmount
          });
        }
      }
    }
  }

  function _encodePayoutInfo(uint256 nextPayoutDay, uint256 endBonusPayoutDebt, uint256 stakeAmount) internal pure returns(uint256) {
    unchecked {
      return (
        nextPayoutDay << TWO_FOURTY
        | uint256(uint120(endBonusPayoutDebt)) << ONE_TWENTY
        | uint256(uint120(stakeAmount))
      );
    }
  }

  /**
   * sets a stake amount to use in the future - when the stake may be ended by others
   * @param stakeId the stake id to target
   * @param futureEndStakeAmount the amount to stake in the future. 0 = stake it all, debt will be used as a staking floor
   */
  function setFutureStakeEndCommunisAmount(uint256 stakeId, uint256 futureEndStakeAmount) external payable {
    // flag to signal that minting has not yet occurred for this stake id (when 0)
    if (Communis(COMM).stakeIdEndBonusPayout(stakeId) != ZERO) { // must be a stake that has not received end bonus payout
      revert NotAllowed();
    }
    (, address staker) = _stakeIdToInfo(stakeId); // must be an unended stake
    if (staker != msg.sender) { // permissioned call
      revert NotAllowed();
    }
    uint256 current = stakeIdCommunisPayoutInfo[stakeId];
    stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
      nextPayoutDay: uint16(current >> TWO_FOURTY),
      endBonusPayoutDebt: futureEndStakeAmount,
      stakeAmount: uint120(current)
    });
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
  function _stakeAmountFromInputs(
    uint256 requestedStakeAmount, address referrer,
    UnderlyingStakeable.StakeStore memory stake
  ) internal view returns(uint256 stakeAmount, address, uint256 payout) {
    unchecked {
      payout = _maxPayout(stake) - Communis(COMM).stakeIdStartBonusPayout(stake.stakeId);
      if (referrer == address(0) || referrer == address(this)) {
        payout += (payout / 100);
        referrer = address(this);
      }
      stakeAmount = _clamp({
        // this is where the 1 offset comes into play: zero means match max value
        amount: requestedStakeAmount,
        // can't underflow, but if it were to, you're staking it all :)
        max: payout
      });
      if (stakeAmount < payout / TWO) {
        stakeAmount = payout / TWO;
      }
    }
    return (stakeAmount, referrer, payout);
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
    uint256 stakeAmount;
    uint256 payout;
    unchecked {
      (stakeAmount, referrer, payout) = _stakeAmountFromInputs({
        requestedStakeAmount: uint120(payoutInfo >> ONE_TWENTY),
        referrer: referrer,
        stake: stake
      });
    }
    _mintStakeBonus();
    // even if the mint fails, we should save the owner at the time that
    // this function was able to be minted (get through all previous filters)
    formerStakeOwner[stakeId] = staker;
    try Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount) {
    } catch {
      // nothing if failure occurs
      return;
    }

    unchecked {
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: today + NINETY_ONE,
        endBonusPayoutDebt: payout / TWO,
        stakeAmount: uint256(uint120(payoutInfo)) + stakeAmount
      });

      _attributeFunds({
        settings: settings,
        token: COMM,
        staker: staker,
        amount: payout - stakeAmount
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

  /**
   * withdraws a stake up to the
   */
  function withdrawAmountByStakeId(uint256 withdrawAmount, uint256 stakeId, bool withdraw) external payable {
    address staker = _verifyOnlyStaker(stakeId);
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
    uint256 stakeManagerStakedAmount = Communis(COMM).addressStakedCodeak(address(this));
    uint256 currentDay = HEX(TARGET).currentDay();
    if (_checkDistribute({
      payoutInfo: payoutInfo,
      currentDay: currentDay,
      stakeManagerStakedAmount: stakeManagerStakedAmount
    })) {
      // assure anything claimable for the stake manager is claimed (for everone)
      _doDistribute({
        payoutInfo: payoutInfo,
        currentDay: currentDay,
        stakeId: stakeId,
        staker: staker,
        withdraw: withdraw
      });
    }
    // we hold the staked amount on this contract in order to break it up
    // between stakes - that way, everyone can get out what they put in
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
        nextPayoutDay: uint16(payoutInfo >> TWO_FOURTY),
        endBonusPayoutDebt: uint120(payoutInfo >> ONE_TWENTY),
        stakeAmount: (stakedAmount - withdrawAmount)
      });
      _attributeFunds({
        settings: withdraw ? SIXTEEN : ZERO,
        staker: staker,
        token: COMM,
        amount: (stakedAmount - withdrawAmount)
      });
    }
  }

  function mintStakeBonus() external payable returns(uint256 distributableBonus) {
    return _mintStakeBonus();
  }

  /**
   * claims stake bonus for everyone staking through stake manager contract
   * @return distributableBonus the total bonus distributed to all stakers in this contract
   */
  function _mintStakeBonus() internal returns(uint256 distributableBonus) {
    uint256 bal = ERC20(COMM).balanceOf(address(this));

    try Communis(COMM).mintStakeBonus() {
      unchecked {
        uint256 delta = ERC20(COMM).balanceOf(address(this)) - bal;
        if (delta > ZERO) {
          attributed[COMM] += delta;
        }
        // need this to be outside of if statement so that it can be used downstream
        distributableBonus = distributableCommunisStakeBonus + delta;
        distributableCommunisStakeBonus = distributableBonus;
      }
    } catch {
      // coveralls-ignore-start
      distributableBonus = distributableCommunisStakeBonus;
      // coveralls-ignore-stop
    }
  }

  function distributeStakeBonusByStakeId(uint256 stakeId, bool withdraw) external payable returns(uint256 payout) {
    address staker = _verifyOnlyStaker(stakeId);
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];

    uint256 stakeManagerStakedAmount = Communis(COMM).addressStakedCodeak(address(this));

    // call external because we need this method for other checks
    uint256 currentDay = HEX(TARGET).currentDay();
    if (_checkDistribute({
      payoutInfo: payoutInfo,
      stakeManagerStakedAmount: stakeManagerStakedAmount,
      currentDay: currentDay
    })) {
      return _doDistribute({
        payoutInfo: payoutInfo,
        currentDay: currentDay,
        stakeId: stakeId,
        staker: staker,
        withdraw: withdraw
      });
    } else {
      revert NotAllowed();
    }
  }
  /**
   * check if a given set of payout info is available to be distributed to from stake
   * @param payoutInfo the payout info being checked for ability to distribute
   * @param currentDay the current hex day
   * @param stakeManagerStakedAmount the amount staked from this address - held on communis contract
   */
  function _checkDistribute(uint256 payoutInfo, uint256 currentDay, uint256 stakeManagerStakedAmount) internal pure returns(bool) {
    unchecked {
      uint256 stakedAmount = uint120(payoutInfo);
      if (stakedAmount == ZERO || stakeManagerStakedAmount == ZERO) {
        // reverts mint from communis
        return false;
      }
      uint256 nextPayoutDay = uint16(payoutInfo >> TWO_FOURTY);
      if (nextPayoutDay > currentDay) {
        // reverts mint from communis
        return false;
      }
    }
    return true;
  }
  /**
   * does the distribution for a given stake given their payout info
   * @param payoutInfo the info tracked for payouts over time
   * @param currentDay the current hex day
   */
  function _doDistribute(
    uint256 payoutInfo, uint256 currentDay,
    uint256 stakeId, address staker, bool withdraw
  ) internal returns(uint256 payout) {
    unchecked {
      uint256 distributableBonus = _mintStakeBonus();
      uint256 stakedAmount = uint256(uint120(payoutInfo));
      uint256 prevPayoutDay = uint16(payoutInfo >> TWO_FOURTY);
      uint256 numberOfPayouts = ((currentDay - prevPayoutDay) / NINETY_ONE) + ONE;

      payout = (stakedAmount * numberOfPayouts) / 80;

      // coveralls-ignore-start
      if (payout > distributableBonus) {
        // Ensure you don't try to pay out more than the distributableBonus
        payout = distributableBonus;
      }
      // coveralls-ignore-stop

      distributableCommunisStakeBonus = (distributableBonus - payout);
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: prevPayoutDay + (numberOfPayouts * NINETY_ONE),
        endBonusPayoutDebt: uint120(payoutInfo >> ONE_TWENTY),
        stakeAmount: stakedAmount
      });
    }
    if (withdraw) {
      // withdrawal does not reduce accounting so we must do it here
      attributed[COMM] -= payout;
      _attributeFunds({
        settings: SIXTEEN,
        staker: staker,
        token: COMM,
        amount: payout
      });
    } else {
      unchecked {
        // accounting has attributed funds to the contract
        // but it has not yet attributed funds to the staker
        withdrawableBalanceOf[COMM][staker] += payout;
      }
    }
  }
}
