const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiString = require('chai-string')
const createRunnerHelper = require('../src/create-runner-helper')

chai.use(chaiAsPromised)
chai.use(chaiString)
chai.should()

describe('Testing create runner helper', () => {
  describe('When getting runner name prefix', () => {
    it('should start with correct runner name', () => {
      createRunnerHelper.getRunnerNamePrefix().should.startWith('vm-gcp')
    })
  })
})
