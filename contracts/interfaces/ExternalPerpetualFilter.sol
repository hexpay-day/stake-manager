// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

abstract contract ExternalPerpetualFilter {
  function verifyPerpetual(address perpetual) external virtual view returns(bool isPerpetual);
}
