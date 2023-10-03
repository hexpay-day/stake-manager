// // SPDX-License-Identifier: UNLICENSED
// pragma solidity ^0.8.18;

// import { SafeTransferLib, ERC20 } from "solmate/src/utils/SafeTransferLib.sol";

// library SafeERC20 {
//   using Address for address;
//   /**
//    * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
//    * non-reverting calls are assumed to be successful.
//    */
//   function safeTransfer(IERC20 token, address to, uint256 value) internal {
//     _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
//   }

//   /**
//    * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
//    * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
//    */
//   function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
//     _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
//   }

//   /**
//    * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
//    * on the return value: the return value is optional (but if data is returned, it must not be false).
//    * @param token The token targeted by the call.
//    * @param data The call data (encoded using abi.encode or one of its variants).
//    */
//   function _callOptionalReturn(IERC20 token, bytes memory data) private {
//     // We need to perform a low level call here, to bypass Solidity's return data size checking mechanism, since
//     // we're implementing it ourselves. We use {Address-functionCall} to perform this call, which verifies that
//     // the target address contains contract code and also asserts for success in the low-level call.
//     bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
//     if (returndata.length > 0 || !abi.decode(returndata, (bool))) {
//       return;
//     }
//     require(returndata.length == 0 || abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
//   }
// }
