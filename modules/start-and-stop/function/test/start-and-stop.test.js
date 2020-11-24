const sandbox = require('sinon').createSandbox()
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
    it('should throw error', () => {
      return startAndStop.startAndStop(null, null).should.rejected
    })
  })
  describe('When start payload', () => {
    it('should trigger scale', async () => {
      const payload = makePayload('start')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleUpAllNonIdlesRunners').resolves().once()
      scaleHelperMock.expects('scaleIdleRunners').resolves().once()

      await startAndStop.startAndStop(payload, makeEvent())

      sandbox.verifyAndRestore()
    })
  })
  describe('When stop payload', () => {
    it('should trigger stop', async () => {
      const payload = makePayload('stop')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllNonIdlesRunners').resolves().once()

      await startAndStop.startAndStop(payload, makeEvent())

      sandbox.verifyAndRestore()
    })
  })
  describe('When healthcheck payload', () => {
    it('Should trigger healthcheck', async () => {
      const payload = makePayload('healthcheck')
      const healthCheckMock = sandbox.mock(healthCheck)
      healthCheckMock.expects('removeOfflineGitHubRunners').resolves().once()

      await startAndStop.startAndStop(payload, makeEvent())

      sandbox.verifyAndRestore()
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
