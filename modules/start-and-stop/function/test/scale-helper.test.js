const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')
const scaleHelper = rewire('../src/scale-helper')
const createRunnerHelper = require('../src/create-runner-helper')
const gitHubHelper = require('../src/github-helper')
const getVMHelper = require('../src/get-runner-helper')
const deleteVmHelper = require('../src/delete-runner-helper')
const runnerType = require('../src/runner-type')

chai.should()
chai.use(chaiAsPromised)

describe('Scale helper tests', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('When calling scale up temp runners', () => {
    it('should scale up temp runners', async () => {
      const count = 3
      sandbox.mock(createRunnerHelper).expects('createRunner').withExactArgs(runnerType.temp).exactly(count).resolves()
      await scaleHelper.scaleUpRunners(runnerType.temp, count)
    })
  })

  describe('When calling scale down runners', () => {
    const scaleDownRunners = scaleHelper.__get__('scaleDownRunners')

    it('should scale down runners according github status', async () => {
      const count = 10
      const busyCount = 6
      const vms = makeFakeVMs(count, false)
      stubExternalDependencies(vms, busyCount)

      await scaleDownRunners(runnerType.temp, count, false)

      countFakeVmsDeleted(vms).should.equals(count - busyCount)
    })
  })

  describe('When get target runner count delta', () => {
    const getTargetRunnerCountDelta = scaleHelper.__get__('getTargetRunnersCountDelta')

    it('should return positive when scaling up', async () => {
      const delta = await getTargetRunnerCountDeltaWrapped(0, 1, getTargetRunnerCountDelta)
      delta.should.equals(1)
    })
    it('should return negative when scaling down', async () => {
      const delta = await getTargetRunnerCountDeltaWrapped(1, 0, getTargetRunnerCountDelta)
      delta.should.equals(-1)
    })
  })
})

async function getTargetRunnerCountDeltaWrapped (givenRunnerCount, targetRunnerCount, getTargetRunnerCountDelta) {
  sandbox.stub(getVMHelper, 'getRunnersVms').resolves(new Array(givenRunnerCount))
  const getTargetRunnersCountStub = sandbox.stub().returns(targetRunnerCount)
  scaleHelper.__set__('getTargetRunnersCount', getTargetRunnersCountStub)
  const delta = await getTargetRunnerCountDelta(true)
  return delta
}

function stubExternalDependencies (vms, busyCount) {
  const getRunnersVmsStub = sandbox.stub(getVMHelper, 'getRunnersVms')
  getRunnersVmsStub.withArgs(runnerType.temp).resolves(vms)
  sandbox.stub(deleteVmHelper, 'deleteRunner').callsFake(async vmName => {
    await vms.filter(vm => vm.name === vmName)[0].delete()
    return Promise.resolve()
  })
  const mergedGithubState = makeFakeGitHubState(vms, busyCount)
  sandbox.stub(gitHubHelper, 'getGcpGitHubRunners').resolves(mergedGithubState)
  sandbox.stub(gitHubHelper, 'getGitHubRunners').resolves(mergedGithubState)
}

function makeFakeGitHubState (vms, busyCount) {
  const mergedGithubState = []
  for (let index = 0; index < vms.length; index++) {
    const busy = index < busyCount
    const gitHubRunnerState = {
      name: vms[index].name,
      status: 'online',
      busy: busy
    }
    mergedGithubState.push(gitHubRunnerState)
  }
  return mergedGithubState
}

function makeFakeVMs (count) {
  const vms = []
  for (let index = 0; index < count; index++) {
    const vm = {
      name: `vm-${index}`,
      delete: async function () {}
    }
    const mockVm = sandbox.mock(vm)
    vm.deleteMock = mockVm.expects('delete').resolves().atLeast(0).atMost(1)
    vms.push(vm)
  }
  return vms
}

function countFakeVmsDeleted (fakeVMs) {
  return fakeVMs.reduce((count, fakeVM) => {
    return count + fakeVM.deleteMock.callCount
  }, 0)
}
