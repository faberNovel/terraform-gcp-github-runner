const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiString = require('chai-string')
const createVMHelper = require('../src/create_vm_helper.js')

chai.use(chaiAsPromised)
chai.use(chaiString)
chai.should()

describe('Testing create vm helper', () => {
  describe('get runner name prefix', () => {
    it('should start with correct vm gcp name', () => {
      createVMHelper.getRunnerNamePrefix().should.startWith('vm-gcp')
    })
  })
})
