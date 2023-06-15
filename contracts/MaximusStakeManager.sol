// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./StakeEnder.sol";
import "./Multicall.sol";
import "./UnderlyingStakeable.sol";

contract MaximusStakeManager is UnderlyingStakeable {
  mapping(address => bool) public publicWhitelist;
  mapping(address => address) public stakeEnder;
  constructor() {
    publicWhitelist[0x0d86EB9f43C57f6FF3BC9E23D8F9d82503f0e84b] = true; // maxi
    publicWhitelist[0x6b32022693210cD2Cfc466b9Ac0085DE8fC34eA6] = true; // deci
    publicWhitelist[0x6B0956258fF7bd7645aa35369B55B61b8e6d6140] = true; // lucky
    publicWhitelist[0xF55cD1e399e1cc3D95303048897a680be3313308] = true; // trio
    publicWhitelist[0xe9f84d418B008888A992Ff8c6D22389C2C3504e0] = true; // base
  }
  function _endPublicStake(address feeTo, address target, uint256 stakeId) internal {
    if (!publicWhitelist[target]) {
      return;
    }
    StakeEnder(_createEndStaker(feeTo)).stakeEnd(target, stakeId);
  }
  function endPublicStake(address target, uint256 stakeId) external {
    _endPublicStake(msg.sender, target, stakeId);
  }
  function endPublicStakeAs(address feeTo, address target, uint256 stakeId) external {
    _endPublicStake(feeTo, target, stakeId);
  }
  function createEndStaker(address owner) external returns(address) {
    return _createEndStaker(owner);
  }
  function _createEndStaker(address owner) internal returns(address stakeEnderAddress) {
    stakeEnderAddress = stakeEnder[owner];
    if (stakeEnderAddress != address(0)) {
      return stakeEnderAddress;
    }
    stakeEnderAddress = address(new StakeEnder{salt: keccak256(abi.encode(owner))}(owner));
    stakeEnder[owner] = stakeEnderAddress;
  }
}
