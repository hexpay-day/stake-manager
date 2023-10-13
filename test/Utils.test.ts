import { expect } from "chai"
import { isOneAtIndex } from '../src/utils'
import _ from 'lodash'

describe('Utils.sol', () => {
  describe('isOneAtIndex', () => {
    it('checks if the index of the provided number has a 1 in binary form', async () => {
      expect(isOneAtIndex(1, 0)).to.be.true
      expect(isOneAtIndex(1, 1)).to.be.false
      expect(isOneAtIndex(2, 1)).to.be.true
    })
  })
})
