const sinon = require('sinon')
const chai = require('chai')
const getVMHelper = require('./get_vm_helper.js')
const Compute = require('@google-cloud/compute')

chai.should()

describe('Testing get vm helper', () => {
  describe('When getting all vms', () => {
    it('gcp option request should be correctly filled', async () => {
      const stub = sinon.stub(Compute.prototype, 'getVMs').returns([])
      await getVMHelper.getAllRunnerVMs()
      const options = stub.getCall(0).args[0]
      options.filter.should.equals('labels.env=test')
      stub.restore()
    })
  })

  describe('When getting idle vms', () => {
    it('gcp option request should be correctly filled', async () => {
      const idle = true
      const stub = sinon.stub(Compute.prototype, 'getVMs').returns([])
      await getVMHelper.getRunnerVMs(idle)
      const options = stub.getCall(0).args[0]
      options.filter.should.equals(`labels.env=test AND labels.idle=${idle}`)
      stub.restore()
    })
  })
})
