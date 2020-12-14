const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scaleHelper = require('../src/scale-helper')
const healthCheck = require('../src/healthcheck')
const startAndStop = require('../src/start-and-stop')
const scalePolicy = require('../src/scale-policy')
const renewRunnerHelper = require('../src/renew-runner')

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
      const data = makeDataFromAction('create_all_temp_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleUpAllTempRunners').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When delete all non idle runners payload', () => {
    it('should delete all non idle runners', async () => {
      const payload = makeDataFromAction('delete_all_temp_runners')
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('scaleDownAllTempRunners').resolves().once()

      await startAndStop.startAndStop(payload, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When healthcheck payload', () => {
    it('should trigger healthcheck', async () => {
      const data = makeDataFromAction('healthcheck')
      const healthCheckMock = sandbox.mock(healthCheck)
      healthCheckMock.expects('healthChecks').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When renew runners payload', () => {
    it('should trigger renew runners', async () => {
      const data = makeDataFromAction('renew_runners')
      const renewRunnerHelperMock = sandbox.mock(renewRunnerHelper)
      renewRunnerHelperMock.expects('renewRunners').resolves().once()

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
      const scalePolicyMock = sandbox.mock(scalePolicy)
      scalePolicyMock.expects('scaleUp').resolves().once()

      await startAndStop.startAndStop(data, makeContext())

      sandbox.verifyAndRestore()
    })
  })
  describe('When scale down payload', () => {
    it('should call scale down', async () => {
      const data = makeDataFromAction('scale_down')
      const scalePolicyMock = sandbox.mock(scalePolicy)
      scalePolicyMock.expects('scaleDown').resolves().once()

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
