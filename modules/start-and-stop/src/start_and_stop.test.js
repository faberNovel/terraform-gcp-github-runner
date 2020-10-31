const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const ScaleHelper = require('./scale_helper.js')
const HealthCheck = require('./healthcheck.js')
const rewire = require('rewire')
const startAndStop = rewire('./start_and_stop.js')

chai.use(chaiAsPromised)
chai.should()

describe('start and stop tests', () => {
  describe('When wrong args', () => {
    it('Should throw error', () => {
      return startAndStop.startAndStop(null, null).should.rejected
    })
  })
  describe('When start payload', () => {
    it('Should trigger scale', async () => {
      const payload = makePayload('start')
      const stubScaleUpNonIdleRunners = sinon.stub(ScaleHelper, 'scaleUpNonIdleRunners').returns(Promise.resolve())
      const stubscaleIdleRunners = sinon.stub(ScaleHelper, 'scaleIdleRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, null)

      stubScaleUpNonIdleRunners.callCount.should.equal(1)
      stubscaleIdleRunners.callCount.should.equal(1)
    })
  })
  describe('When stop payload', () => {
    it('Should trigger stop', async () => {
      const payload = makePayload('stop')
      const stubScaleDownNonIdleRunners = sinon.stub(ScaleHelper, 'scaleDownNonIdleRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, null)

      stubScaleDownNonIdleRunners.callCount.should.equal(1)
    })
  })
  describe('When healthcheck payload', () => {
    it('Should trigger healthcheck', async () => {
      const payload = makePayload('healthcheck')
      const stubRemoveDisconnectedGcpRunners = sinon.stub(HealthCheck, 'removeDisconnectedGcpRunners').returns(Promise.resolve())
      const stubRemoveOfflineGitHubRunners = sinon.stub(HealthCheck, 'removeOfflineGitHubRunners').returns(Promise.resolve())
      const stubStartRunners = sinon.stub().returns(Promise.resolve())
      const revert = startAndStop.__set__('startRunners', stubStartRunners)

      await startAndStop.startAndStop(payload, null)

      stubRemoveDisconnectedGcpRunners.callCount.should.equal(1)
      stubRemoveOfflineGitHubRunners.callCount.should.equal(1)
      stubStartRunners.callCount.should.equal(1)
      revert()
    })
  })
})

function makePayload (action) {
  const json = {
    action: action
  }
  const jsonBase64 = Buffer.from(JSON.stringify(json)).toString('base64')
  const payload = {
    data: jsonBase64
  }
  return payload
}
