// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./IUnderlyingStakeable.sol";

interface IHEX is IERC20, IERC20Metadata, IUnderlyingStakeable {
  event StakeStart(
    uint256 data0,
    address indexed stakerAddr,
    uint40 indexed stakeId
  );
  event StakeEnd(
    uint256 data0,
    uint256 data1,
    address indexed stakerAddr,
    uint40 indexed stakeId
  );
}
