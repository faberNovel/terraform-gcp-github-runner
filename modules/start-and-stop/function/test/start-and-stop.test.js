const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scaleHelper = require('../src/scale-helper')
const healthCheck = require('../src/healthcheck')
const rewire = require('rewire')
const startAndStop = rewire('../src/start-and-stop')

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
      const stubScaleUpNonIdleRunners = sinon.stub(scaleHelper, 'scaleUpNonIdleRunners').returns(Promise.resolve())
      const stubscaleIdleRunners = sinon.stub(scaleHelper, 'scaleIdleRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, null)

      stubScaleUpNonIdleRunners.callCount.should.equal(1)
      stubscaleIdleRunners.callCount.should.equal(1)
    })
  })
  describe('When stop payload', () => {
    it('Should trigger stop', async () => {
      const payload = makePayload('stop')
      const stubScaleDownNonIdleRunners = sinon.stub(scaleHelper, 'scaleDownNonIdleRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, null)

      stubScaleDownNonIdleRunners.callCount.should.equal(1)
    })
  })
  describe('When healthcheck payload', () => {
    it('Should trigger healthcheck', async () => {
      const payload = makePayload('healthcheck')
      const stubRemoveDisconnectedGcpRunners = sinon.stub(healthCheck, 'removeDisconnectedGcpRunners').returns(Promise.resolve())
      const stubRemoveOfflineGitHubRunners = sinon.stub(healthCheck, 'removeOfflineGitHubRunners').returns(Promise.resolve())
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
