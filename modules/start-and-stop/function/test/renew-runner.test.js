const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const renewRunnerHelper = require('../src/renew-runner')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')

chai.should()
chai.use(chaiAsPromised)

describe('Renew runners tests', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('When renew idle runners', () => {
    it('should renew all idle runners', async () => {
      const idle = true
      const currentIdleRunnerCount = 3
      const targetIdleRunnerCount = 2
      const force = true
      const scaleHelperMock = sandbox.mock(scaleHelper)
      sandbox.stub(getRunnerHelper, 'getRunnersVms').withArgs(idle).resolves(makeVms(currentIdleRunnerCount))
      scaleHelperMock.expects('getTargetRunnersCount').returns(targetIdleRunnerCount)
      scaleHelperMock.expects('scaleDownRunners').withExactArgs(idle, currentIdleRunnerCount, force).once()
      scaleHelperMock.expects('scaleUpRunners').withExactArgs(idle, targetIdleRunnerCount).once()

      await renewRunnerHelper.renewIdleRunners()
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
