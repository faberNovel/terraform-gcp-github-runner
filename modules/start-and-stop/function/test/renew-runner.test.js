const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const renewRunnerHelper = require('../src/renew-runner')
const getRunnerHelper = require('../src/get-runner-helper')
const deleteRunnerHelper = require('../src/delete-runner-helper')
const scalePolicy = require('../src/scale-policy')

chai.should()
chai.use(chaiAsPromised)

describe('Renew runners tests', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('When renew runners', () => {
    it('should renew all runners', async () => {
      const agedRunnersCount = 3

      sandbox.stub(getRunnerHelper, 'getAgedRunnersVms').resolves(makeVms(agedRunnersCount))
      sandbox.mock(deleteRunnerHelper).expects('deleteRunner').resolves(true).exactly(agedRunnersCount)
      sandbox.mock(scalePolicy).expects('scaleUp').resolves().once()

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
