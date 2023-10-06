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
    END,
    BONUS
  }

  address public hx = 0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39;
  uint256 distributableStakeBonus = 0;

  mapping(uint256 stakeId => uint256 endBonusDebt) public stakeIdEndBonusDebt;
  mapping(uint256 stakeId => uint256 stakedAmount) public stakeIdStakedAmount;
  mapping(uint256 stakeId => address formerOwner) public formerStakeOwner;
  mapping(uint256 stakeId => uint256 nextPayoutDay) public stakeIdNextPayoutDay;

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
    _claimStakeBonus();
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

              stakeIdStakedAmount[stakeId] += (stakeAmount << TWO) >> TWO;

              _attributeFunds({
                settings: settings,
                token: COMM,
                staker: staker,
                amount: ERC20(COMM).balanceOf(address(this)) - bal
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
          formerStakeOwner[stakeId] = staker;
          Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount);

          if (stakeAmount > ZERO) {
            stakeIdStakedAmount[stakeId] += stakeAmount;
          }
          stakeIdEndBonusDebt[stakeId] = Communis(COMM).stakeIdEndBonusPayout(stakeId) / TWO;
          stakeIdNextPayoutDay[stakeId] = IHEX(hx).currentDay() + 91;

          _attributeFunds({
            settings: settings,
            token: COMM,
            staker: staker,
            amount: ERC20(COMM).balanceOf(address(this)) - bal
          });
        }
      }
    } else {
      // bonus - generally we are going to assume that this
      // is rarely if ever going to be called so we are not going to do checks
      Communis(COMM).mintStakeBonus();
      if (referrer != address(0)) {
        _addToTokenWithdrawable({
          token: COMM,
          to: referrer,
          amount: ERC20(COMM).balanceOf(address(this)) - bal
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
    uint256 stakeAmount = futureStakeEndCommunisAmount[stakeId];
    _claimStakeBonus();
    if (stakeAmount > ZERO) {
      Communis.PayoutResponse memory res = Communis(COMM).getPayout(Communis.Stake(
        stakeId,
        stake.stakedHearts,
        stake.stakeShares,
        stake.lockedDay,
        stake.stakedDays,
        stake.unlockedDay
      ));
      uint256 maxPayout = res.maxPayout - Communis(COMM).stakeIdStartBonusPayout(stakeId);
      if (maxPayout < stakeAmount) {
        stakeAmount = maxPayout;
      }
      futureStakeEndCommunisAmount[stakeId] = ZERO;
    }
    uint256 bal = ERC20(COMM).balanceOf(address(this));
    if (referrer == address(0)) {
      referrer = address(this);
    }
    formerStakeOwner[stakeId] = staker;
    try Communis(COMM).mintEndBonus(index, stakeId, referrer, stakeAmount) {
    } catch {
      // nothing if failure occurs
      return;
    }

    stakeIdStakedAmount[stakeId] += stakeAmount;
    stakeIdEndBonusDebt[stakeId] = Communis(COMM).stakeIdEndBonusPayout(stakeId) / TWO;
    stakeIdNextPayoutDay[stakeId] = IHEX(hx).currentDay() + 91;

    _attributeFunds({
      settings: settings,
      token: COMM,
      staker: staker,
      amount: ERC20(COMM).balanceOf(address(this)) - bal
    });
  }

  function withdrawAmountByStakeId(uint256 withdrawAmount, uint256 stakeId) external payable {
    address staker = formerStakeOwner[stakeId];
    if (staker != msg.sender) {
      staker = _stakeIdToOwner(stakeId);
      if (staker != msg.sender) {
        revert NotAllowed();
      }
    }
    // we hold the staked amount on this contract in order to break it up
    // between stakes - that way, everyone can get out what they put in
    uint256 stakedAmount = stakeIdStakedAmount[stakeId];
    if (withdrawAmount > stakedAmount) {
      revert NotAllowed();
    }

    uint256 stakedAmountAfterWithdraw = (stakedAmount - withdrawAmount);
    if (stakedAmountAfterWithdraw < stakeIdEndBonusDebt[stakeId]) {
      revert NotAllowed();
    }

    Communis(COMM).withdrawStakedCodeak(withdrawAmount);
    stakeIdStakedAmount[stakeId] = stakedAmountAfterWithdraw;
    _addToTokenWithdrawable({
      token: COMM,
      to: staker,
      amount: withdrawAmount
    });
  }

  function claimStakeBonus() external { 
    _claimStakeBonus(); 
  }

  function _claimStakeBonus() internal { 
    uint256 bal = ERC20(COMM).balanceOf(address(this));

    Communis(COMM).mintStakeBonus(); 

    uint256 mintedStakeBonus = ERC20(COMM).balanceOf(address(this)) - bal;

    distributableStakeBonus += mintedStakeBonus;
  }

  function distributeStakeBonusByStakeId(UnderlyingStakeable.StakeStore memory stake) external {
    _claimStakeBonus(); // assure anything claimable for the stake manager is claimed (for everone )

    uint256 stakeId = stake.stakeId;
    uint256 currentDay = IHEX(hx).currentDay();
    uint256 nextPayoutDay = stakeIdNextPayoutDay[stakeId];

    require(nextPayoutDay >= currentDay, "Stake Id does not have an available stake bonus");

    uint256 stakedAmount = stakeIdStakedAmount[stakeId];
    uint256 stakeManagerStakedAmount = Communis(COMM).addressStakedCodeak(address(this));

    require(stakedAmount > 0, "Stake Id has no Staked Amount");
    require(stakeManagerStakedAmount > 0, "Stake Manager has no Staked Amount");

    // This looks at how much a given stakeId is currently contributing to the total amount staked in the stake manager.
    // contributionPercentage goes up and down with stakedAmount given fixed stakeManagerStakedAmount
    // contributionPercentage goes up and down with stakeManagerStakedAmount given fixed stakedAmount
    //    -If others reduce the stakeManagerStakedAmount by withdrawing their staked COM (and not running distributeStakeBonusByStakeId for themself)
    //        contributionPercentage goes up and distributableStakeBonus simply gets redistributed accordingly.

    uint256 contributionPercentage = (stakedAmount * (10 ** 5)) / stakeManagerStakedAmount;
    uint256 contributionTotal = (distributableStakeBonus * contributionPercentage) / (10 ** 5); 

    uint256 numberOfPayouts = ((currentDay - nextPayoutDay) / 91) + 1;
    uint256 payout = contributionTotal * numberOfPayouts;

    uint256 settings = stakeIdToSettings[stakeId];
    (, address staker) = _stakeIdToInfo(stakeId);

    //mint directly to staker?
    _attributeFunds({
      settings: settings,
      token: COMM,
      staker: staker,
      amount: payout
    });

    distributableStakeBonus -= payout;
    stakeIdNextPayoutDay[stakeId] += (numberOfPayouts * 91);
  }

}
