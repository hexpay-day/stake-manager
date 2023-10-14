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

  uint256 public distributableCommunis;
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
   * @param stakeAmount the amount of the start bonus to stake.
   * the left-most bit designated as a boolean for applying restake bonus
   * @notice during stake good accounting, stakeAmount is used
   * as a boolean 1 = withdraw, anything else = custody in contract
   */
  function mintCommunis(
    CommunisMintPortion portion,
    uint256 stakeId, address referrer,
    uint256 stakeAmount
  ) external payable returns(uint256 amount) {
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
            amount = ERC20(COMM).balanceOf(address(this)) - bal;
            uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
            stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
              nextPayoutDay: HEX(TARGET).currentDay() + NINETY_ONE,
              // we have to maintain this value because it may be used by future stake amount
              endBonusPayoutDebt: uint120(payoutInfo >> ONE_TWENTY),
              stakeAmount: stakeAmount,
              hasEnded: ZERO
            });
            _attributeFunds({
              settings: settings,
              token: COMM,
              staker: staker,
              amount: amount
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
            amount = ERC20(COMM).balanceOf(address(this)) - bal;
            _attributeFunds({
              // 16 always yields true for the 4th index
              settings: stakeAmount == ONE ? SIXTEEN : ZERO,
              staker: referrer,
              token: COMM,
              amount: amount
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
          requestedReferrer: referrer,
          stake: stake
        });
        Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount);
        // stakeAmount must be at least half of stakeIdEndBonusPayout.
        // Luckily stakeIdEndBonusPayout represents pr.maxPayout - stakeIdStartBonusPayout[stakeID] (from com.sol)
        unchecked {
          // stake has not yet ended, so we can tell whoever ends the stake
          // to not try to mint communis
          _setEndStakedSignal();
          uint256 updatedSettings = (
            ((settings >> INDEX_RIGHT_HAS_EXTERNAL_TIPS) << INDEX_RIGHT_HAS_EXTERNAL_TIPS)
            | (uint8(settings << ONE) >> ONE)
          );
          if (updatedSettings != settings) {
            stakeIdToSettings[stakeId] = updatedSettings;
          }
          uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
          stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
            nextPayoutDay: HEX(TARGET).currentDay() + NINETY_ONE,
            // overrides the future stake amount set by user
            endBonusPayoutDebt: payout / TWO,
            stakeAmount: uint120(payoutInfo >> ONE) + stakeAmount,
            hasEnded: ONE
          });
          amount = payout - stakeAmount;
          _attributeFunds({
            settings: settings,
            token: COMM,
            staker: staker,
            amount: amount
          });
        }
      }
    }
  }
  function _setEndStakedSignal() internal {
    if ((distributableCommunis >> TWO_FOURTY) == ZERO) {
      distributableCommunis |= (uint256(ONE) << TWO_FOURTY);
    }
  }

  /**
   * track information regarding the state of payout for a single stake
   * saving information like this allows for 1 SLOAD instead of multiple calls to
   * the external/underlying contract and multiple SLOADs
   * @param nextPayoutDay the next day that a distribution can occur for the linked stake id
   * @param endBonusPayoutDebt the amount of debt that the end stake payout accrued.
   * stakeAmount must never go below this number. value must fit within uint120
   * @param stakeAmount the amount staked by the linked stake id value must fit within uint119
   * @param hasEnded 1/0 whether or not the stake has been ended
   * it is simply easier to keep this in uint form because there are fewer required operations
   */
  function _encodePayoutInfo(
    uint256 nextPayoutDay,
    uint256 endBonusPayoutDebt,
    uint256 stakeAmount,
    uint256 hasEnded
  ) internal pure returns(uint256 encoded) {
    unchecked {
      return (
        nextPayoutDay << TWO_FOURTY
        | uint256(uint120(endBonusPayoutDebt)) << ONE_TWENTY
        | uint256(uint120(stakeAmount << ONE))
        | hasEnded
      );
    }
  }

  /**
   * sets a stake amount to use in the future - when the stake may be ended by others
   * @param stakeId the stake id to target
   * @param futureEndStakeAmount the amount to stake in the future
   * 0 = stake it all, debt will be used as a staking floor
   */
  function setFutureStakeEndCommunisAmount(uint256 stakeId, uint256 futureEndStakeAmount) external payable {
    // flag to signal that minting has not yet occurred for this stake id (when 0)
    if (Communis(COMM).stakeIdEndBonusPayout(stakeId) != ZERO) {
      // must be a stake that has not received end bonus payout
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
      stakeAmount: uint120(current) >> ONE,
      hasEnded: ZERO
    });
  }
  /**
   * calculate the maximum payout that can be achieved by this stake - ignoring start bonus
   * @param stake the stake being ended
   * @return maxPayout the maximum payout that can be achieved by this stake
   */
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
   *
   * @param requestedStakeAmount the requested stake amount from client
   * may be untrustworthy so we will put it through some filters
   * @param requestedReferrer the referrer requested by the client
   * @param stake the stake struct that is being ended
   * @return stakeAmount the stake amount to use, clamped to the payout as max and the debt as min
   * @return referrer the account that will receive funds
   * @return payout the payout that is occuring as the maxPayout - start bonus payout
   * which could have only been minted by the stake owner
   */
  function _stakeAmountFromInputs(
    uint256 requestedStakeAmount, address requestedReferrer,
    UnderlyingStakeable.StakeStore memory stake
  ) internal view returns(uint256 stakeAmount, address referrer, uint256 payout) {
    unchecked {
      payout = _maxPayout(stake) - Communis(COMM).stakeIdStartBonusPayout(stake.stakeId);
      if (requestedReferrer == address(0) || requestedReferrer == address(this)) {
        payout += (payout / 100);
        referrer = address(this);
      } else {
        referrer = requestedReferrer;
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
        requestedReferrer: referrer,
        stake: stake
      });
    }
    uint256 distributed;
    (distributed, payoutInfo, ) = _distributeCommunisStakeBonusByStakeId({
      to: staker,
      withdraw: (settings >> INDEX_RIGHT_SHOULD_SEND_TOKENS_TO_STAKER) == ONE,
      day: today,
      payoutInfo: payoutInfo
    });
    // even if the mint fails, we should save the owner at the time that
    // this function was able to be minted (get through all previous filters)
    formerStakeOwner[stakeId] = staker;
    try Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount) {
    } catch {
      _attributeFunds({
        settings: settings,
        token: COMM,
        staker: staker,
        amount: distributed
      });
      // nothing if failure occurs
      return;
    }
    _setEndStakedSignal();

    unchecked {
      stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
        nextPayoutDay: today + NINETY_ONE,
        // overrides the future stake amount set by users
        endBonusPayoutDebt: payout / TWO,
        stakeAmount: (uint120(payoutInfo) >> ONE) + stakeAmount,
        hasEnded: ONE
      });

      _attributeFunds({
        settings: settings,
        token: COMM,
        staker: staker,
        amount: distributed + (payout - stakeAmount)
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
   * withdraws a stake up to the debt limit
   * @param withdrawAmount the desired amount to withdraw - can be truncated if debt cannot cover
   * @param stakeId the stake id to target - this is a permissioned method - caller must be owner or previous owner
   * @param withdraw the funds should be withdrawn to the address, otherwise custodied by this contract
   */
  function withdrawCommunisByStakeId(
    uint256 withdrawAmount,
    uint256 stakeId,
    bool withdraw, address to
  ) external payable returns(uint256) {
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
    if (uint16(payoutInfo >> TWO_FOURTY) == ZERO) {
      return ZERO;
    }

    address staker = _verifyOnlyStaker(stakeId);
    to = to == address(0) ? staker : to;
    {
      uint256 anyEnded;
      (, payoutInfo, anyEnded) = _distributeCommunisStakeBonusByStakeId({
        to: to,
        withdraw: withdraw,
        payoutInfo: payoutInfo,
        day: HEX(TARGET).currentDay()
      });
      if (anyEnded == ZERO) {
        return ZERO;
      }
    }
    // we hold the staked amount on this contract in order to break it up
    // between stakes - that way, everyone can get out what they put in
    unchecked {
      uint256 hasEnded = payoutInfo % TWO;
      uint256 stakedAmount = uint256(uint120(payoutInfo) >> ONE);
      if (withdrawAmount > stakedAmount) {
        withdrawAmount = stakedAmount;
      }

      // debt
      uint256 endBonusPayoutDebt = uint120(payoutInfo >> ONE_TWENTY);
      uint256 stakedAmountAfter = stakedAmount - withdrawAmount;
      // only take end bonus debt payout into account if the stake has been ended
      // otherwise user can withdraw all staked from start
      if (hasEnded == ONE && stakedAmountAfter < endBonusPayoutDebt) {
        withdrawAmount = stakedAmount - endBonusPayoutDebt;
        stakedAmountAfter = endBonusPayoutDebt;
      }

      if (withdrawAmount > ZERO) {
        Communis(COMM).withdrawStakedCodeak(withdrawAmount);
        stakeIdCommunisPayoutInfo[stakeId] = _encodePayoutInfo({
          nextPayoutDay: uint16(payoutInfo >> TWO_FOURTY),
          endBonusPayoutDebt: endBonusPayoutDebt,
          stakeAmount: stakedAmountAfter,
          hasEnded: hasEnded
        });
        _attributeFunds({
          settings: withdraw ? SIXTEEN : ZERO,
          staker: to,
          token: COMM,
          amount: withdrawAmount
        });
      }
      return withdrawAmount;
    }
  }

  /**
   * mint the stake bonus for the stake manager contract - useful for keeping accounting up to date
   */
  function mintStakeBonus() external payable returns(bool anyEnded, uint256 currentDistributableCommunis) {
    uint256 hasEnded;
    (hasEnded, currentDistributableCommunis) = _mintStakeBonus();
    anyEnded = hasEnded == ONE;
  }

  /**
   * claims stake bonus for everyone staking through stake manager contract
   * @return anyEnded 1/0 to signal that an end stake bonus has occurred
   * @return currentDistributableCommunis the total bonus distributed to all stakers in this contract
   */
  function _mintStakeBonus() internal returns(uint256 anyEnded, uint256 currentDistributableCommunis) {
    uint256 bal = ERC20(COMM).balanceOf(address(this));
    Communis(COMM).mintStakeBonus();
    unchecked {
      uint256 delta = ERC20(COMM).balanceOf(address(this)) - bal;
      currentDistributableCommunis = distributableCommunis;
      anyEnded = currentDistributableCommunis >> TWO_FOURTY;
      currentDistributableCommunis = uint240(currentDistributableCommunis) + delta;
      if (delta > ZERO) {
        // expensive to write (SSTORE), so it's going behind an if statement
        attributed[COMM] += delta;
        distributableCommunis = (
          (anyEnded << TWO_FOURTY)
          | currentDistributableCommunis
        );
      }
    }
  }

  /**
   *
   * @param stakeId the stake id to use to apply limits to the distribution
   * @param withdraw whether or not the funds should be transferred to the stake owner
   */
  function distributeCommunisStakeBonusByStakeId(
    uint256 stakeId,
    bool withdraw, address to
  ) external payable returns(uint256 payout) {
    address staker = _verifyOnlyStaker(stakeId);
    to = to == address(0) ? staker : to;
    uint256 payoutInfo = stakeIdCommunisPayoutInfo[stakeId];
    unchecked {
      if (uint16(payoutInfo >> TWO_FOURTY) == ZERO) {
        return ZERO;
      }
    }

    // call external because we need this method for other checks
    uint256 day = HEX(TARGET).currentDay();
    (payout, payoutInfo, ) = _distributeCommunisStakeBonusByStakeId({
      to: to,
      withdraw: withdraw,
      payoutInfo: payoutInfo,
      day: day
    });
    if (payout > ZERO) {
      stakeIdCommunisPayoutInfo[stakeId] = payoutInfo;
    }
  }
  function _distributeCommunisStakeBonusByStakeId(
    address to, bool withdraw,
    uint256 payoutInfo, uint256 day
  ) internal returns(uint256 payout, uint256 nextPayoutInfo, uint256 anyEnded) {
    uint256 currentDistributableCommunis;
    (anyEnded, currentDistributableCommunis) = _mintStakeBonus();
    if (_checkDistribute({
      anyEnded: anyEnded,
      payoutInfo: payoutInfo,
      day: day
    })) {
      (payout, nextPayoutInfo) = _doDistribute({
        payoutInfo: payoutInfo,
        day: day,
        to: to,
        withdraw: withdraw,
        anyEnded: anyEnded,
        currentDistributableCommunis: currentDistributableCommunis
      });
    } else {
      nextPayoutInfo = payoutInfo;
    }
  }
  /**
   * check if a given set of payout info is available to be distributed to from stake
   * @param payoutInfo the payout info being checked for ability to distribute
   * @param day the current hex day
   */
  function _checkDistribute(
    uint256 anyEnded, uint256 payoutInfo, uint256 day
  ) internal pure returns(bool canDistribute) {
    unchecked {
      // has anything staked
      return ((uint120(payoutInfo) >> ONE) > ZERO)
        // it is your day to be paid out
        && (uint16(payoutInfo >> TWO_FOURTY) <= day)
        // if anyone has ended then there is debt
        // which will allow us to mint the start bonuses every 91 days
        && anyEnded == ONE;
    }
  }
  /**
   * does the distribution for a given stake given their payout info
   * @param payoutInfo the info tracked for payouts over time
   * @param day the current hex day
   */
  function _doDistribute(
    uint256 payoutInfo, uint256 day,
    address to, bool withdraw, uint256 anyEnded,
    uint256 currentDistributableCommunis
  ) internal returns(uint256 payout, uint256 nextPayoutInfo) {
    unchecked {
      uint256 stakedAmount = uint256(uint120(payoutInfo) >> ONE);
      uint256 nextPayoutDay = uint16(payoutInfo >> TWO_FOURTY);
      // we already checked that day is >= nextPayoutDay in check _checkDistribute
      uint256 numberOfPayouts = ((day - nextPayoutDay) / NINETY_ONE) + ONE;

      payout = (stakedAmount * numberOfPayouts) / 80;

      distributableCommunis = (
        (anyEnded << TWO_FOURTY)
        | (currentDistributableCommunis - payout)
      );
      nextPayoutInfo = _encodePayoutInfo({
        nextPayoutDay: nextPayoutDay + (numberOfPayouts * NINETY_ONE),
        endBonusPayoutDebt: uint120(payoutInfo >> ONE_TWENTY),
        stakeAmount: stakedAmount,
        hasEnded: payoutInfo % TWO
      });
    }
    if (withdraw) {
      // withdrawal does not reduce accounting so we must do it here
      attributed[COMM] -= payout;
      _attributeFunds({
        settings: SIXTEEN,
        staker: to,
        token: COMM,
        amount: payout
      });
    } else {
      unchecked {
        // accounting has attributed funds to the contract
        // but it has not yet attributed funds to the account
        withdrawableBalanceOf[COMM][to] += payout;
      }
    }
  }
}
