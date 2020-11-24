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
      const stubScaleUpAllNonIdlesRunners = sinon.stub(scaleHelper, 'scaleUpAllNonIdlesRunners').returns(Promise.resolve())
      const stubscaleIdleRunners = sinon.stub(scaleHelper, 'scaleIdleRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, makeEvent())

      stubScaleUpAllNonIdlesRunners.callCount.should.equal(1)
      stubscaleIdleRunners.callCount.should.equal(1)
    })
  })
  describe('When stop payload', () => {
    it('Should trigger stop', async () => {
      const payload = makePayload('stop')
      const stubScaleDownAllNonIdlesRunners = sinon.stub(scaleHelper, 'scaleDownAllNonIdlesRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, makeEvent())

      stubScaleDownAllNonIdlesRunners.callCount.should.equal(1)
    })
  })
  describe('When healthcheck payload', () => {
    it('Should trigger healthcheck', async () => {
      const payload = makePayload('healthcheck')
      const stubRemoveDisconnectedGcpRunners = sinon.stub(healthCheck, 'removeOfflineGitHubRunners').returns(Promise.resolve())

      await startAndStop.startAndStop(payload, makeEvent())

      stubRemoveDisconnectedGcpRunners.callCount.should.equal(1)
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

function makeEvent () {
  return {
    timestamp: new Date().toISOString()
  }
}
