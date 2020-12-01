const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const renewRunnerHelper = require('../src/renew-runner')
const scaleHelper = require('../src/scale-helper')

chai.should()
chai.use(chaiAsPromised)

describe('Renew runners tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When renew idle runners', () => {
    it('should renew all idle runners', async () => {
      const idle = true
      const targetIdleRunnerCount = 2
      const force = true
      const scaleHelperMock = sandbox.mock(scaleHelper)
      scaleHelperMock.expects('getTargetRunnersCount').returns(targetIdleRunnerCount)
      scaleHelperMock.expects('scaleDownRunners').withExactArgs(idle, targetIdleRunnerCount, force).once()
      scaleHelperMock.expects('scaleUpRunners').withExactArgs(idle, targetIdleRunnerCount).once()
      renewRunnerHelper.renewIdleRunners()
    })
  })
})
