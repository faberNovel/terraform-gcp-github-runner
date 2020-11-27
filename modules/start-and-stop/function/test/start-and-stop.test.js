const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scaleHelper = require('../src/scale-helper')
const healthCheck = require('../src/healthcheck')
const startAndStop = require('../src/start-and-stop')

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
      const data = makeDataFromAction('create_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleUpAllNonIdlesRunners').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When delete all non idle runners payload', () => {
    it('should delete all non idle runners', async () => {
      const payload = makeDataFromAction('delete_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllNonIdlesRunners').withExactArgs(false).resolves().once()

      await startAndStop.startAndStop(payload, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When force delete all non idle runners payload', () => {
    it('should force delete all non idle runners', async () => {
      const data = makeDataFromAction('force_delete_all_non_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllNonIdlesRunners').withExactArgs(true).resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When healthcheck payload', () => {
    it('should trigger healthcheck', async () => {
      const data = makeDataFromAction('healthcheck')
      const healthCheckMock = sandbox.mock(healthCheck)
      healthCheckMock.expects('removeOfflineGitHubRunners').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When renew idle runners payload', () => {
    it('should trigger renew idle runners', async () => {
      const data = makeDataFromAction('renew_idle_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('renewIdleRunners').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When receive invalide payload isPayloadValid', () => {
    it('should return false', async () => {
      startAndStop.isPayloadValid({}).should.be.false
    })
  })
  describe('When receive too old context isEventAgeTooOld', () => {
    it('should return true', async () => {
      startAndStop.isEventAgeTooOld(new Date(0)).should.be.true
    })
  })
  describe('When scale up payload', () => {
    it('should call scale up', async () => {
      const data = makeDataFromAction('scale_up')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleUp').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When scale down payload', () => {
    it('should call scale down', async () => {
      const data = makeDataFromAction('scale_down')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDown').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
})

function makeDataFromAction (action) {
  const json = {
    action: action
  }
  const jsonBase64 = Buffer.from(JSON.stringify(json)).toString('base64')
  const data = {
    data: jsonBase64
  }
  return data
}

function makeContext () {
  return {
    timestamp: new Date().toISOString()
  }
}
