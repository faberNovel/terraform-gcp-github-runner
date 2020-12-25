const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')
const scaleHelper = rewire('../src/scale-helper')
const scalePolicySettings = require('../src/scale-policy-settings')
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

  describe('When calling scale up runners', () => {
    it('should scale up runners', async () => {
      const count = 3
      sandbox.mock(createRunnerHelper).expects('createRunner').withExactArgs(runnerType.default).exactly(count).resolves()
      await scaleHelper.scaleUpRunners(count)
    })
  })

  describe('When calling scale down runners', () => {
    const scaleDownRunners = scaleHelper.__get__('scaleDownRunners')

    it('should scale down runners according github status', async () => {
      const count = 10
      const busyCount = 6
      const vms = makeFakeVMs(count)
      stubExternalDependencies(vms, busyCount)

      await scaleDownRunners(count)

      countFakeVmsDeleted(vms).should.equals(count - busyCount)
    })
  })

  describe('When get runners delta to max count', () => {
    const getRunnersDeltaToMaxCountFun = scaleHelper.__get__('getRunnersDeltaToMaxCount')

    it('should return positive when scaling up', async () => {
      const delta = await getRunnersDeltaToMaxCountWrapped(0, 1, getRunnersDeltaToMaxCountFun)
      delta.should.equals(1)
    })
    it('should return negative when scaling down', async () => {
      const delta = await getRunnersDeltaToMaxCountWrapped(1, 0, getRunnersDeltaToMaxCountFun)
      delta.should.equals(-1)
    })
  })
})

async function getRunnersDeltaToMaxCountWrapped (givenRunnersCount, runnersMaxCount, getRunnersDeltaToMaxCount) {
  sandbox.stub(getVMHelper, 'getRunnersVms').resolves(new Array(givenRunnersCount))
  sandbox.stub(scalePolicySettings, 'upMax').returns(runnersMaxCount)
  const delta = await getRunnersDeltaToMaxCount(true)
  return delta
}

function stubExternalDependencies (vms, busyCount) {
  const getRunnersVmsStub = sandbox.stub(getVMHelper, 'getRunnersVms')
  getRunnersVmsStub.resolves(vms)
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
