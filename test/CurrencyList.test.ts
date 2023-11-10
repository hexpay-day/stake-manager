import { loadFixture } from "@nomicfoundation/hardhat-network-helpers"
import { ethers } from 'ethers'
import { expect } from "chai"
import * as utils from './utils'
import _ from 'lodash'

describe('CurrencyList.sol', () => {
  it('starts with 3 tokens', async () => {
    const x = await loadFixture(utils.deployFixture)
    await expect(x.stakeManager.currencyListSize())
      .eventually.to.equal(4)
  })
  describe('addCurrencyToList', () => {
    it('cannot add zero address again', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(4)
      await x.stakeManager.addCurrencyToList(ethers.ZeroAddress)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(4)
    })
    it('cannot add a token more than once', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(4)
      await x.stakeManager.addCurrencyToList(await x.stakeManager.TARGET())
      await expect(x.stakeManager.currencyListSize())
        .eventually.to.equal(4)
    })
    it('disallows non deployed contracts', async () => {
      const x = await loadFixture(utils.deployFixture)
      await expect(x.stakeManager.addCurrencyToList(x.signers[0].address))
        .to.revertedWithCustomError(x.stakeManager, 'NotAllowed')
    })
    it('adds currency hashes to a list', async () => {
      const x = await loadFixture(utils.deployFixture)
      const index = await x.stakeManager.currencyListSize()
      await expect(x.stakeManager.addCurrencyToList(x.usdc.getAddress()))
        .to.revertedWithCustomError(x.stakeManager, 'MustBeHolder')
      await utils.leechUsdc(1n, x.signers[0].address, x)
      await expect(x.stakeManager.addCurrencyToList(x.usdc.getAddress()))
        .to.emit(x.stakeManager, 'AddCurrency')
        .withArgs(await x.usdc.getAddress(), index)
      await expect(x.stakeManager.addCurrencyToList(x.usdc.getAddress()))
        .not.to.emit(x.stakeManager, 'AddCurrency')
    })
  })
})
