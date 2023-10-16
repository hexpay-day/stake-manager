// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

abstract contract MaximusPerpetual {
  function getEndStaker() external virtual view returns(address end_staker_address);
}
