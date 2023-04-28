import { impersonateAccount, loadFixture, stopImpersonatingAccount, time } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as ethers from 'ethers'
import { HEX } from "../artifacts/types/contracts/reference/Hex.sol"
import * as withArgs from '@nomicfoundation/hardhat-chai-matchers/withArgs'
import { days } from "@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time/duration"

describe("StakeEnder", function () {
  const hexAddress = hre.ethers.utils.getAddress('0x2b591e99afe9f32eaa6214f7b7629768c40eeb39')
  const deployFixture = async () => {
    const StakeEnder = await hre.ethers.getContractFactory('StakeEnder')
    const StakeManager = await hre.ethers.getContractFactory('StakeManager')
    const stakeEnder = await StakeEnder.deploy(hexAddress)
    await stakeEnder.deployed()
    const signers = await hre.ethers.getSigners()
    const pulsexSacrificeAddress = hre.ethers.utils.getAddress('0x075e72a5edf65f0a5f44699c7654c1a76941ddc8')
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
          .approve(stakeEnder.address, hre.ethers.constants.MaxUint256),
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
      stakeEnder,
      StakeEnder,
      StakeManager,
    }
  }
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  // async function deployOneYearLockFixture() {
  //   const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60
  //   const ONE_GWEI = 1_000_000_000

  //   const lockedAmount = ONE_GWEI
  //   const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS

  //   // Contracts are deployed using the first signer/account by default
  //   const [owner, otherAccount] = await ethers.getSigners()

  //   const Lock = await ethers.getContractFactory("Lock")
  //   const lock = await Lock.deploy(unlockTime, { value: lockedAmount })

  //   return { lock, unlockTime, lockedAmount, owner, otherAccount }
  // }

  describe("deployment", function () {
    it("should set the target address", async function () {
      const x = await loadFixture(deployFixture)
      await expect(x.stakeEnder.target()).eventually.to.equal(hexAddress)
    })
    it('should have a percentMagnitudeLimit', async function() {
      const x = await loadFixture(deployFixture)
      await expect(x.stakeEnder.percentMagnitudeLimit()).eventually.to.equal(1_000_000_000_000_000n)
    })
  })

  describe("withdrawals", () => {
    it("should not allow too much to be withdrawn", async function () {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2, signer3] = x.signers
      await expect(x.stakeEnder.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeEnder.address, x.oneMillion)
      await expect(x.stakeEnder.connect(signer2).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeEnder.address, x.oneMillion)
      await expect(x.hex.balanceOf(x.stakeEnder.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeEnder.connect(signer3).withdrawTokenTo(signer1.address, 1))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(0, 1)
      await expect(x.stakeEnder.connect(signer2).withdrawTokenTo(signer1.address, 1n + x.oneMillion))
        .to.be.revertedWithCustomError(x.StakeManager, 'NotEnoughFunding')
        .withArgs(x.oneMillion, 1n + x.oneMillion)
    })
    it('should allow the contract to define how much to withdraw', async function () {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2] = x.signers
      await expect(x.stakeEnder.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeEnder.address, x.oneMillion)
      await expect(x.stakeEnder.connect(signer2).depositTokenTo(signer1.address, x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer2.address, x.stakeEnder.address, x.oneMillion)
      await expect(x.stakeEnder.withdrawableBalanceOf(signer1.address))
        .eventually.to.equal(x.oneMillion * 2n)
      await expect(x.stakeEnder.withdrawableBalanceOf(signer2.address))
        .eventually.to.equal(0)
      await expect(x.stakeEnder.connect(signer1).withdrawTokenTo(signer1.address, 0))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, signer1.address, x.oneMillion * 2n)
    })
  })
  describe('stake starts', () => {
    it('can only be initiated from the owning address', async function () {
      const x = await loadFixture(deployFixture)
      const [signer1] = x.signers
      await expect(x.stakeEnder.connect(signer1).depositToken(x.oneMillion))
        .to.emit(x.hex, 'Transfer')
        .withArgs(signer1.address, x.stakeEnder.address, x.oneMillion)
      let stakeId!: number;
      await expect(x.stakeEnder.connect(signer1).stakeStart(x.oneMillion, 10))
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, hre.ethers.constants.AddressZero, x.oneMillion)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(() => true, x.stakeEnder.address, (value: number) => {
          stakeId = value
          return true
        })
      await expect(x.stakeEnder.stakeIdToOwner(stakeId))
        .eventually.to.equal(signer1.address)
    })
    it('multiple can be started in the same tx by the ender at the direction of the owner', async () => {
      const x = await loadFixture(deployFixture)
      const [signer1] = x.signers
      await x.stakeEnder.connect(signer1).depositToken(x.oneMillion)
      await expect(x.stakeEnder.connect(signer1).multicall([
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeEnder.address, x.nextStakeId)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeEnder.address, x.nextStakeId + 1n)
    })
  })
  describe('stakeEndFor', () => {
    it('multiple can be ended in the same transaction by anyone', async () => {
      const x = await loadFixture(deployFixture)
      const [signer1, signer2, signer3, signer4] = x.signers
      // const signerStakes = 2
      // let signer1StakeId1!: number;
      await x.stakeEnder.connect(signer1).depositToken(x.oneMillion)
      await x.stakeEnder.connect(signer2).depositToken(x.oneMillion)
      await x.stakeEnder.connect(signer3).depositToken(x.oneMillion)
      // add in 4 so that balance is always non zero (better gas tests)
      await x.stakeEnder.connect(signer4).depositToken(x.oneMillion)
      await x.stakeEnder.connect(signer1).multicall([
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 10]),
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 20]),
      ], false)

      await expect(x.stakeEnder.stakeIdToOwner(x.nextStakeId))
        .eventually.to.equal(signer1.address)
      await expect(x.stakeEnder.stakeIdToOwner(x.nextStakeId + 1n))
        .eventually.to.equal(signer1.address)
      await time.setNextBlockTimestamp(days(5) + await time.latest())
      await expect(x.stakeEnder.connect(signer2).multicall([
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 5]),
        x.stakeEnder.interface.encodeFunctionData('stakeStart', [x.oneMillion / 2n, 15]),
      ], false))
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeEnder.address, x.nextStakeId + 2n)
        .to.emit(x.hex, 'StakeStart')
        .withArgs(withArgs.anyValue, x.stakeEnder.address, x.nextStakeId + 3n)
      await time.setNextBlockTimestamp(days(6) + await time.latest())
      const greaterThan0 = (value: ethers.BigNumber) => value.gt(0)
      await expect(x.stakeEnder.connect(signer4).multicall([
        x.stakeEnder.interface.encodeFunctionData('stakeEndFor', [signer2.address, 2, x.nextStakeId + 2n, false]),
        x.stakeEnder.interface.encodeFunctionData('stakeEndFor', [signer1.address, 0, x.nextStakeId, false]),
      ], false))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeEnder.address, greaterThan0)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, signer1.address, greaterThan0)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, signer2.address, greaterThan0)
      await time.setNextBlockTimestamp(days(10) + await time.latest())
      // this is going to be tricky
      await expect(x.stakeEnder.connect(signer4).multicall([
        x.stakeEnder.interface.encodeFunctionData('stakeEndFor', [signer1.address, 1, x.nextStakeId + 1n, false]),
        x.stakeEnder.interface.encodeFunctionData('stakeEndFor', [signer2.address, 0, x.nextStakeId + 3n, false]),
      ], false))
        .to.emit(x.hex, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeEnder.address, greaterThan0)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, signer1.address, greaterThan0)
        .to.emit(x.hex, 'Transfer')
        .withArgs(x.stakeEnder.address, signer2.address, greaterThan0)
    })
  })
})
