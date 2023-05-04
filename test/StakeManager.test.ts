import { impersonateAccount, loadFixture, stopImpersonatingAccount, time } from "@nomicfoundation/hardhat-network-helpers"
import * as Chai from "chai"
import * as hre from "hardhat"
import * as ethers from 'ethers'
import _ from 'lodash'
import { HEX } from "../artifacts/types/contracts/reference/Hex.sol"
import * as withArgs from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"
const expect = Chai.expect

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

const hexAddress = hre.ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')
const pulsexSacrificeAddress = hre.ethers.utils.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')
const deployFixture = async () => {
  const StakeManager = await hre.ethers.getContractFactory('StakeManager')
  const ConsentualStakeManager = await hre.ethers.getContractFactory('ConsentualStakeManager')
  const stakeManager = await ConsentualStakeManager.deploy()
  await stakeManager.deployed()
  const signers = await hre.ethers.getSigners()
  await impersonateAccount(pulsexSacrificeAddress)
  const pulsexSacrificeSigner = await hre.ethers.getSigner(pulsexSacrificeAddress)
  const hexArtifact = await hre.artifacts.readArtifact('HEX')
  const hex = await hre.ethers.getContractAtFromArtifact(hexArtifact, hexAddress, pulsexSacrificeSigner) as HEX
  // hre.tracer.printNext = true
  const oneMillion = hre.ethers.utils.parseUnits('1000000', await hex.decimals()).toBigInt()
  await Promise.all(signers.slice(0, 20).map(async (signer) => {
    await Promise.all([
      // allow infinite flow
      hex.connect(signer)
        .approve(stakeManager.address, hre.ethers.constants.MaxUint256),
      hex.transfer(signer.address, oneMillion),
    ])
  }))
  await stopImpersonatingAccount(pulsexSacrificeAddress)
  const [, , , , , , stakeIdBN] = await hex.globalInfo()
  return {
    nextStakeId: stakeIdBN.toBigInt() + 1n,
    hex,
    oneMillion,
    signers,
    stakeManager,
    StakeManager,
    ConsentualStakeManager,
  }
}

const moveForwardDays = async (limit: number, signer: SignerWithAddress, x: Awaited<ReturnType<typeof deployFixture>>) => {
  let i = 0;
  do {
    await time.setNextBlockTimestamp(days(1) + await time.latest())
    await x.hex.connect(signer).stakeStart(hre.ethers.utils.parseUnits('1', 8), 1)
    i += 1
  } while(i < limit)
}

describe("StakeEnder", function () {
  describe("deployment", function () {
    it('should have a percentMagnitudeLimit', async function() {
      const x = await loadFixture(deployFixture)
      await expect(x.stakeManager.percentMagnitudeLimit()).eventually.to.equal(
        hre.ethers.BigNumber.from(2).pow(64).toBigInt() - 1n
      )
    })
  })

  describe("withdrawals", () => {
    it("should not allow too much to be withdrawn", async function () {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.hex.balanceOf(x.stakeManager.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.connect(signer3).withdrawTokenTo(signer1.address, 1))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(0, 1)
      await expect(x.stakeManager.connect(signer2).withdrawTokenTo(signer1.address, 1n + x.oneMillion))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(x.oneMillion, 1n + x.oneMillion)
    })
    it('should allow the contract to define how much to withdraw', async function () {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.connect(signer2).depositTokenTo(signer1.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeManager.address, x.oneMillion)
      await expect(x.stakeManager.withdrawableBalanceOf(signer1.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeManager.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeManager.connect(signer1).withdrawTokenTo(signer1.address, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, signer1.address, x.oneMillion * 2n)
    })
  })
  describe('depositing tokens', async () => {
    it('can transfer tokens from sender to contract', async function() {
      const x = await loadFixture(deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeManager.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
    })
  })
  describe('stake starts', () => {
    it('can only be initiated from the owning address', async function () {
      const x = await loadFixture(deployFixture)
      const [signer1] = x.signers
      const isolatedStakeManager = await x.stakeManager.callStatic.getIsolatedStakeManager(signer1.address)
      await expect(x.stakeManager.connect(signer1).stakeStart(x.oneMillion, 10))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeManager.address, x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, isolatedStakeManager, x.oneMillion)
        .to.emit(x.hex, 'Transfer')
        .withArgs(isolatedStakeManager, hre.ethers.constants.AddressZero, x.oneMillion)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(() => true, isolatedStakeManager, x.nextStakeId)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
    })
    it('multiple can be started in the same tx by the ender at the direction of the owner', async () => {
      const x = await loadFixture(deployFixture)
      const [signer1] = x.signers
      const isolatedStakeManager = await x.stakeManager.callStatic.getIsolatedStakeManager(signer1.address)
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, isolatedStakeManager, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, isolatedStakeManager, x.nextStakeId + 1n)
    })
  })
  describe('stakeEnd', () => {
    it('multiple can be ended and restarted in the same transaction', async () => {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const isolatedStakeManager1 = await x.stakeManager.callStatic.getIsolatedStakeManager(signer1.address)
      await x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false)

      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
      await expect(x.stakeManager.stakeIdToOwner(x.nextStakeId + 1n))
        .eventually.to.equal(signer1.address)

      await moveForwardDays(11, signer4, x)
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEnd', [0, x.nextStakeId]),
        x.stakeManager.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyValue, withArgs.anyValue, isolatedStakeManager1, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, isolatedStakeManager1, x.nextStakeId + 2n + 11n)
    })
  })
  describe('stakeEndByConsent', () => {
    it('can start stakes and end them - all managed by a single contract', async function () {
      this.timeout(100_000_000)
      const x = await loadFixture(deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      const days = 369
      const half1 = Math.floor(days / 2)
      const half2 = days - half1
      await expect(x.stakeManager.connect(signer1).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, half1]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, days]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 1n)
      await expect(x.stakeManager.connect(signer2).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, half1]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, days]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 3n)
      await expect(x.stakeManager.connect(signer3).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, half1]),
        x.stakeManager.interface.encodeFunctionData('stakeStartFromBalance', [true, x.oneMillion / 2n, days]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeManager.address, x.nextStakeId + 5n)
      // all 4 stakes are applied to the single manager (optimized)
      await expect(x.hex.stakeCount(x.stakeManager.address))
        .eventually.to.equal(6)
      await moveForwardDays(half1 + 1, signer4, x)
      await expect(x.stakeManager.connect(signer4).multicall([
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [signer3.address, false, true, 4, x.nextStakeId + 4n]),
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [signer2.address, false, true, 2, x.nextStakeId + 2n]),
        x.stakeManager.interface.encodeFunctionData('stakeEndByConsent', [signer1.address, false, true, 0, x.nextStakeId + 0n]),
      ], false))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 4n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 0n)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
        .printGasUsage()
      await moveForwardDays(half2, signer4, x)
      const count = await x.hex.stakeCount(x.stakeManager.address)
      const list = await Promise.all((new Array(count.toNumber())).fill(null).map((_a, i) => {
        return x.hex.stakeLists(x.stakeManager.address, i)
      }))
      await expect(x.stakeManager.connect(signer4).stakeEndByConsentForMany(([
        [signer3.address, x.nextStakeId + 5n],
        [signer1.address, x.nextStakeId + 3n],
        [signer2.address, x.nextStakeId + 1n],
      ] as [string, bigint][]).map(([staker, stakeId]) => ({
        internallyManaged: true,
        staker,
        stakeIndex: _.findIndex(list, {
          stakeId: hre.ethers.BigNumber.from(stakeId).toNumber(),
        }),
        stakeId,
      }))))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 5n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 1n)
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(withArgs.anyUint, withArgs.anyUint, x.stakeManager.address, x.nextStakeId + 3n)
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, withArgs.anyUint)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeManager.address, hre.ethers.constants.AddressZero, withArgs.anyUint)
        .printGasUsage()
    })
  })
})
