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
  describe('When create all non idle runners payload', () => {
    it('should create all non idle runners', async () => {
      const payload = makePayload('create_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleUpAllNonIdlesRunners').resolves().once()

      await startAndStop.startAndStop(payload, makeEvent())

      sandbox.verifyAndRestore()
    })
  })
  describe('When delete all non idle runners payload', () => {
    it('should delete all non idle runners', async () => {
      const payload = makePayload('delete_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllNonIdlesRunners').withExactArgs(false).resolves().once()

      await startAndStop.startAndStop(payload, makeEvent())

      sandbox.verifyAndRestore()
    })
  })
  describe('When force delete all non idle runners payload', () => {
    it('should force delete all non idle runners', async () => {
      const payload = makePayload('force_delete_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllNonIdlesRunners').withExactArgs(true).resolves().once()

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
  describe('When renew idle runners payload', () => {
    it('Should trigger renew idle runners', async () => {
      const payload = makePayload('renew_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('renewIdleRunners').resolves().once()

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
