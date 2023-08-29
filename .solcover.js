module.exports = {
  configureYulOptimizer: true,
  skipFiles: [
    'reference',
    'interfaces',
  ],
  // solcOptimizerDetails: {
  //   peephole: false,
  //   inliner: false,
  //   jumpdestRemover: false,
  //   orderLiterals: true,  // <-- TRUE! Stack too deep when false
  //   deduplicate: false,
  //   cse: false,
  //   constantOptimizer: false,
  //   yul: false
  // },
  // measureStatementCoverage: false,
  // providerOptions: {
  //   default_balance_ether: '1000000000000000000000000000',
  // },
  // mocha: {
  //   fgrep: '[skip-on-coverage]',
  //   invert: true,
  // },
};
