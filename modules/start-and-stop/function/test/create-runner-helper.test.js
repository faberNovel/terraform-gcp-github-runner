const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiString = require('chai-string')
const createRunnerHelper = require('../src/create-runner-helper')

chai.use(chaiAsPromised)
chai.use(chaiString)
chai.should()

describe('Testing create vm helper', () => {
  describe('get runner name prefix', () => {
    it('should start with correct vm gcp name', () => {
      createRunnerHelper.getRunnerNamePrefix().should.startWith('vm-gcp')
    })
  })
})
