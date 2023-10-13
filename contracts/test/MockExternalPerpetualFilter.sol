// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import { ExternalPerpetualFilter } from "../interfaces/ExternalPerpetualFilter.sol";

contract MockExternalPerpetualFilter is ExternalPerpetualFilter {
  bool internal _isPerpetual = false;
  function setVerifyPerpetualResult(bool result) external {
    _isPerpetual = result;
  }
  function verifyPerpetual(address) external override view returns(bool) {
    return _isPerpetual;
  }
}
