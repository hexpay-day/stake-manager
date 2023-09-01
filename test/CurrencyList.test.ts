import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { ethers } from 'ethers'
import { expect } from "chai"
import * as utils from './utils'
import _ from 'lodash'

describe('CurrencyList.sol', () => {
  it('starts with 3 tokens', async () => {
    const x = await loadFixture(utils.deployFixture)
    await expect(x.stakeManager.currencyListSize())
      .eventually.to.equal(3)
  })
  describe('addCurrencyToList', () => {
    it('cannot add zero address again', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(3)
      await x.stakeManager.addCurrencyToList(ethers.constants.AddressZero)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(3)
    })
    it('cannot add a token more than once', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(3)
      await x.stakeManager.addCurrencyToList(await x.stakeManager.TARGET())
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(3)
    })
    it('disallows non deployed contracts', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.addCurrencyToList(x.signers[0].address))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
    it('adds currency hashes to a list', async () => {
      const x = await loadFixture(utils.deployFixture)
      const index = await x.stakeManager.currencyListSize()
      await expect(x.stakeManager.addCurrencyToList(x.usdc.address))
        .to.emit(x.stakeManager, 'AddCurrency')
        .withArgs(x.usdc.address, index)
      await expect(x.stakeManager.addCurrencyToList(x.usdc.address))
        .not.to.emit(x.stakeManager, 'AddCurrency')
    })
  })
})
