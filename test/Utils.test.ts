import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { expect } from "chai"
import * as utils from './utils'
import _ from 'lodash'

describe('Utils.sol', () => {
  describe('isOneAtIndex', () => {
    it('checks if the index of the provided number has a 1 in binary form', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.utils.isOneAtIndex(1, 0))
        .eventually.to.be.true
      await expect(x.utils.isOneAtIndex(1, 1))
        .eventually.to.be.false
      await expect(x.utils.isOneAtIndex(2, 1))
        .eventually.to.be.true
    })
  })
})
