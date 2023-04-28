
declare namespace Chai {
  interface Assertion {
    printGasUsage(): Assertion;
  }
  interface AsyncAssertion extends Assertion, Promise<void> {
    printGasUsage(): AsyncAssertion;
  }
}
