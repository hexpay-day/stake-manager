import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
// import * as hre from "hardhat"
import * as utils from './utils'
import _ from 'lodash'
// import { anyUint, anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs"

describe('Capable.sol', () => {
  describe('isCapable', () => {
    it('checks if the index of the provided number has a 1 in binary form', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.capable.isCapable(1, 0))
        .eventually.to.be.true
      await expect(x.capable.isCapable(1, 1))
        .eventually.to.be.false
      await expect(x.capable.isCapable(2, 1))
        .eventually.to.be.true
    })
  })
})
