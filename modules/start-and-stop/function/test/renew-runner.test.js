const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const renewRunnerHelper = require('../src/renew-runner')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')
const runnerType = require('../src/runner-type')

chai.should()
chai.use(chaiAsPromised)

describe('Renew runners tests', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('When renew runners', () => {
    it('should renew all runners', async () => {
      const currentIdleRunnerCount = 3
      const targetIdleRunnerCount = 2
      const scaleHelperMock = sandbox.mock(scaleHelper)
      sandbox.stub(getRunnerHelper, 'getRunnersVms').withArgs(runnerType.idle).resolves(makeVms(currentIdleRunnerCount))
      scaleHelperMock.expects('getTargetRunnersCount').returns(targetIdleRunnerCount)
      scaleHelperMock.expects('scaleDownRunners').withExactArgs(runnerType.idle, currentIdleRunnerCount).once()
      scaleHelperMock.expects('scaleUpRunners').withExactArgs(runnerType.idle, targetIdleRunnerCount).once()
      scaleHelperMock.expects('scaleDownAllTempRunners').once()

      await renewRunnerHelper.renewRunners()
    })
  })
})

function makeVms (count) {
  const vms = []
  for (let index = 0; index < count; index++) {
    const vm = {
      name: `vm-${index}`
    }
    vms.push(vm)
  }
  return vms
}
