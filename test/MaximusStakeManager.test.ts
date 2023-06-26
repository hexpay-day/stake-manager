import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('MaximusStakeManager.sol', () => {
  describe('stakeEnd', () => {
    it('can end the perpetual\'s stake', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEnd(signerA.address, x.base, stake.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.base, stake.stakeId)
    })
    it('can end the perpetual\'s stake and name any address as the rewards recipient', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [, signerB] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEnd(signerB.address, x.base, stake.stakeId))
        .to.emit(x.hex, 'StakeEnd')
        .withArgs(anyUint, anyUint, x.base, stake.stakeId)
    })
    it('fails if perpetual is not whitelisted', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, , signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await expect(x.maximusStakeManager.stakeEnd(signerA.address, signerC.address, stake.stakeId))
        .to.revertedWithCustomError(x.maximusStakeManager, 'NotAllowed')
    })
    it('can collect rewards', async () => {
      const x = await loadFixture(utils.endOfBaseFixture)
      const [signerA, , signerC] = x.signers
      const stake = await x.hex.stakeLists(x.base, 0)
      await x.maximusStakeManager.stakeEnd(signerA.address, x.base, stake.stakeId)
      const oneEther = hre.ethers.utils.parseEther('1')
      await signerC.sendTransaction({
        value: oneEther,
        to: x.gasReimberser.address,
      })
      await x.hex.connect(signerC).transfer(x.gasReimberser.address, x.stakedAmount)
      await expect(x.maximusStakeManager.flush(x.gasReimberser.address, x.base, 2, [hre.ethers.constants.AddressZero]))
        .changeEtherBalances(
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [oneEther.toBigInt() * -1n, oneEther, 0],
        )
      await expect(x.maximusStakeManager.flush(x.gasReimberser.address, x.base, 2, [x.hex.address]))
        .changeTokenBalances(x.hex,
          [x.gasReimberser, x.maximusStakeManager, signerA],
          [x.stakedAmount * -1n, x.stakedAmount, 0],
        )
      const balanceNative = await signerA.provider?.getBalance(x.maximusStakeManager.address)
      const bal = balanceNative?.toBigInt() || 0n
      const balanceToken = await x.hex.balanceOf(x.maximusStakeManager.address)
      const balToken = balanceToken.toBigInt()
      await expect(x.maximusStakeManager.withdraw(x.base, 2, signerA.address, [hre.ethers.constants.AddressZero, x.hex.address], [0, 0]))
        .changeEtherBalances(
          [x.maximusStakeManager, signerA],
          [bal * -1n, bal],
        )
        .changeTokenBalances(x.hex,
          [x.maximusStakeManager, signerA],
          [balToken * -1n, balToken],
        )
    })
  })
})
