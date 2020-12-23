const sinon = require('sinon')
const chai = require('chai')
const getRunnerHelper = require('../src/get-runner-helper')
const Compute = require('@google-cloud/compute')

chai.should()

describe('Testing get runner vm helper', () => {
  describe('When getting all runners vms', () => {
    it('gcp option request should be correctly filled', async () => {
      const stub = sinon.stub(Compute.prototype, 'getVMs').returns([])

      await getRunnerHelper.getRunnersVms()

      const options = stub.getCall(0).args[0]
      options.filter.should.equals('labels.env=test')
      stub.restore()
    })
  })
})
