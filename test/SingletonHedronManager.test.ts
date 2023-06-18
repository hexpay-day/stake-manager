import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('SingletonHedronManager.sol', () => {
  describe('mintRewards', () => {
    it('mints rewards from stakes', async () => {
      const x = await loadFixture(utils.stakeSingletonBagAndWait)
      const settings = await x.stakeManager.defaultSettings()
      const nuSettings = {
        ...settings,
        consentAbilities: parseInt('1101', 2),
      }
      const data = await Promise.all(x.stakeIds.map(async (stakeId) => (
        x.stakeManager.interface.encodeFunctionData('updateSettings', [
          stakeId,
          nuSettings,
        ])
      )))
      const [signerA] = x.signers
      await x.stakeManager.connect(signerA).multicall(data, false)
      await utils.moveForwardDays(2, x.signers[x.signers.length - 1], x)
      await expect(x.stakeManager.mintRewards(x.stakeIds))
        .to.emit(x.hedron, 'Transfer')
        .withArgs(hre.ethers.constants.AddressZero, x.stakeManager.address, anyUint)
      await expect(x.hedron.balanceOf(x.stakeManager.address))
        .eventually.to.equal(await x.stakeManager.outstandingHedronTokens(signerA.address))
    })
  })
})
