// import { TracerEnvUser } from "hardhat-tracer";

declare module 'soldoc' {}
declare namespace Chai {
  interface Assertion {
    printGasUsage(): Assertion;
    printGasUsage(args?: TracerEnvUser): Assertion;
  }
  interface AsyncAssertion extends Assertion, Promise<void> {
    printGasUsage(): AsyncAssertion;
    printGasUsage(args?: TracerEnvUser): AsyncAssertion;
  }
}
