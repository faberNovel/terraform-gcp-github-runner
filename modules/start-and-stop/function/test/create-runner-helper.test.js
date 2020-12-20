const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiString = require('chai-string')
const createRunnerHelper = require('../src/create-runner-helper')
const runnerType = require('../src/runner-type')

chai.use(chaiAsPromised)
chai.use(chaiString)
chai.should()

describe('Testing create runner helper', () => {
  describe('When getting runner name prefix', () => {
    it('should start with correct runner name', () => {
      createRunnerHelper.getRunnerNamePrefix(runnerType.temp).should.startWith('vm-gcp')
    })
  })
})
