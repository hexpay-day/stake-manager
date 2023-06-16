import * as ethers from 'ethers'
import * as hre from "hardhat"
import * as Chai from "chai"

Chai.Assertion.addMethod('printGasUsage', function (this: any) {
  let subject = this._obj
  if (typeof subject === "function") {
    subject = subject()
  }
  const target: ethers.providers.TransactionResponse | Promise<ethers.providers.TransactionResponse> = subject
  const printGasUsed = async (
    [tx]:
    [ethers.providers.TransactionResponse],
  ) => {
    const prev = hre.tracer.gasCost
    hre.tracer.gasCost = true
    await hre.run('trace', {
      hash: tx.hash,
    })
    hre.tracer.gasCost = prev
  }
  const derivedPromise = Promise.all([
    target,
  ])
    .then(printGasUsed)

  this.then = derivedPromise.then.bind(derivedPromise)
  this.catch = derivedPromise.catch.bind(derivedPromise)
  return this
})
