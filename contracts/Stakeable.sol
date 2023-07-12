// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./UnderlyingStakeable.sol";
import "./IStakeable.sol";

abstract contract Stakeable is IStakeable, UnderlyingStakeable {
  /** start a stake */
  function stakeStart(uint256 newStakedHearts, uint256 newStakedDays) virtual external;
  /** end a stake */
  function stakeEnd(uint256 stakeIndex, uint40 stakeId) virtual external;
}
