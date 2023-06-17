import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('MaximusStakeManager.sol', () => {
  describe('createStakeManager', () => {
    it('can create for unknown addresses', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      let key!: string
      key = await x.maximusStakeManagerFactory.stakeManagerKey(signerB.address, 0)
      await expect(x.maximusStakeManagerFactory.stakeManager(key))
        .eventually.to.equal(hre.ethers.constants.AddressZero)
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .to.emit(x.maximusStakeManagerFactory, 'CreateMaximusStakeManager')
        .withArgs(signerB.address, 0, anyValue)
      key = await x.maximusStakeManagerFactory.stakeManagerKey(signerB.address, 0)
      await expect(x.maximusStakeManagerFactory.stakeManager(key))
        .eventually.not.to.equal(hre.ethers.constants.AddressZero)
    })
    it('can run create with the same arguments and get the same result', async () => {
      const x = await loadFixture(utils.deployFixture)
      const [, signerB] = x.signers
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .to.emit(x.maximusStakeManagerFactory, 'CreateMaximusStakeManager')
        .withArgs(signerB.address, 0, anyValue)
      await expect(x.maximusStakeManagerFactory.createStakeManager(signerB.address, 0))
        .not.to.rejected
    })
  })
})
