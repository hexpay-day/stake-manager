// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "./IPublicEndStakeable.sol";
import "./HSIStakeManager.sol";
import { IGasReimberser } from './GasReimberser.sol';

contract MaximusStakeManager is HSIStakeManager {
  using Address for address payable;
  mapping(address => bool) public perpetualWhitelist;
  /**
   * bytes32 is a key made up of the perpetual whitelist address + the iteration of the stake found at
   */
  mapping(bytes32 => address) public rewardsTo;
  mapping(bytes32 => mapping(address => uint256)) public rewards;
  event CollectReward(
    address indexed perpetual,
    uint256 indexed period,
    address indexed token,
    uint256 amount
  );
  event DistributeReward(
    address indexed perpetual,
    uint256 indexed period,
    address indexed token,
    uint256 amount
  );

  // allow this contract to receive tokens on behalf of enders
  receive() external payable {}
  constructor() HSIStakeManager() {
    // unfortunately, this is the appropriate place to have this code
    perpetualWhitelist[0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b] = true; // maxi
    perpetualWhitelist[0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6] = true; // deci
    perpetualWhitelist[0x6B0956258fF7bd7645aa35369B55B61b8e6d6140] = true; // lucky
    perpetualWhitelist[0xF55cD1e399e1cc3D95303048897a680be3313308] = true; // trio
    perpetualWhitelist[0xe9f84d418B008888A992Ff8c6D22389C2C3504e0] = true; // base
  }
  modifier onlyEnder(address perpetual, uint256 period) {
    if (rewardsTo[_rewardKey(perpetual, period)] != msg.sender) {
      revert NotAllowed();
    }
    _;
  }
  modifier onlyCurrentPeriod(address perpetual, uint256 period) {
    // no need to fail - just disallow
    if (IPublicEndStakeable(perpetual).getCurrentPeriod() != period) {
      return;
    }
    _;
  }
  /** check if the target address is a known perpetual */
  modifier onlyPerpetual(address perpetual) {
    if (!perpetualWhitelist[perpetual]) {
      revert NotAllowed();
    }
    _;
  }
  /**
   * end a stake on a known perpetual
   * @param perpetual the perpetual to end a stake on
   * @param stakeId the stake id to end
   */
  function stakeEnd(address rewarded, address perpetual, uint256 stakeId) external onlyPerpetual(perpetual) {
    IPublicEndStakeable endable = IPublicEndStakeable(perpetual);
    // STAKE_END_DAY is locked + staked days - 1 so > is correct in this case
    if (IHEX(target).currentDay() > endable.STAKE_END_DAY() && endable.STAKE_IS_ACTIVE()) {
      endable.mintHedron(0, uint40(stakeId));
      endable.endStakeHEX(0, uint40(stakeId));
      // by now we have incremented by 1 since the start of this function
      rewardsTo[_rewardKey(perpetual, endable.getCurrentPeriod())] = rewarded;
      // add 1 because the period will increment at the next stake start (1 week's time)
      // so this contract should also recognize that range until the end
      rewardsTo[_rewardKey(perpetual, endable.getCurrentPeriod() + 1)] = rewarded;
    }
  }
  /**
   * create a key to hold reward data against for a perpetual address and its period
   * @param perpetual the perpetual pool to target
   * @param period the period of the perpetual pool to target
   * @notice the period will be different between the end->start + start->end state changes
   * so both n and n+1 should be checked when querying the outstanding rewards
   */
  function rewardKey(address perpetual, uint256 period) external pure returns(bytes32) {
    return _rewardKey(perpetual, period);
  }
  function _rewardKey(address perpetual, uint256 period) internal pure returns(bytes32) {
    return keccak256(abi.encode(perpetual, period));
  }
  /**
   * flush erc20 tokens into this contract
   * @param gasReimberser the address to collect gas reimbersement from
   * @param perpetual the perpetual pool to call flush on
   * @param period the period that the token collects against
   * @param tokens the token addresses to flush into this contract
   * @notice this assumes that only one token is flushed at a time
   * accounting will be lost if this patterns is broken by distribution tokens
   * or perpetual sending more than one token at a time
   * @dev this method should not be chained to a stake end - it should be done in a separate transaction
   */
  function flush(
    address gasReimberser,
    address perpetual,
    uint256 period,
    address[] calldata tokens
  )
    external
    onlyEnder(perpetual, period)
    onlyCurrentPeriod(perpetual, period)
    onlyPerpetual(perpetual)
  {
    uint256 len = tokens.length;
    uint256 i;
    bytes32 key = _rewardKey(perpetual, period);
    do {
      address token = tokens[i];
      uint256 bal = _getBalance(token);
      if (token == address(0)) {
        IGasReimberser(gasReimberser).flush();
      } else {
        IGasReimberser(gasReimberser).flush_erc20(token);
      }
      bal = _getBalance(token) - bal;
      rewards[key][token] += bal;
      {
        emit CollectReward(perpetual, period, token, bal);
      }
      unchecked {
        ++i;
      }
    } while (i < len);
  }
  function _getBalance(address token) internal view returns(uint256) {
    return token == address(0)
      ? address(this).balance
      : IERC20(token).balanceOf(address(this));
  }
  /**
   * withdraw erc20 tokens to a provided address
   * @param recipient address to receive tokens
   * @param tokens token to send
   * @param amounts amounts as a list of the token to send - 0 = balance
   */
  function withdraw(
    address perpetual,
    uint256 period,
    address payable recipient,
    address[] calldata tokens,
    uint256[] calldata amounts
  ) external onlyEnder(perpetual, period) {
    uint256 i;
    bytes32 key = _rewardKey(perpetual, period);
    do {
      address token = tokens[i];
      uint256 amount = amounts[i];
      uint256 max = rewards[key][token];
      amount = amount == 0 || amount > max ? max : amount;
      if (amount > 0) {
        unchecked {
          rewards[key][token] -= amount;
        }
        if (token == address(0)) {
          recipient.sendValue(amount);
        } else {
          if (!IERC20(token).transfer(recipient, amount)) {
            revert NotAllowed();
          }
        }
        {
          emit DistributeReward(perpetual, period, token, amount);
        }
      }
      unchecked {
        ++i;
      }
      // unoptimized - but ran into stack error
    } while (i < tokens.length);
  }
}
