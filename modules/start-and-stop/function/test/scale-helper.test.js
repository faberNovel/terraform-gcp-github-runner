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

  describe('When calling scale up idle runners', () => {
    it('should scale up idle runners', async () => {
      const count = 3
      sandbox.mock(createRunnerHelper).expects('createRunner').withExactArgs(runnerType.idle).exactly(count).resolves()
      await scaleHelper.scaleUpRunners(runnerType.idle, count)
    })
  })

  describe('When calling scale down runners', () => {
    const scaleDownRunners = scaleHelper.__get__('scaleDownRunners')

    it('should scale down runners when force is used', async () => {
      const idleCount = 5
      const idleBusyCount = 2
      const idleVms = makeFakeVMs(idleCount, true)
      const nonIdleCount = 10
      const nonIdleBusyCount = 6
      const nonIdleVms = makeFakeVMs(nonIdleCount, false)
      stubExternalDependencies(idleVms, idleBusyCount, nonIdleVms, nonIdleBusyCount)

      await scaleDownRunners(runnerType.idle, idleCount, true)

      countFakeVmsDeleted(idleVms).should.equals(idleCount)
      countFakeVmsDeleted(nonIdleVms).should.equals(0)
    })

    it('should scale down runners according github status when force is not used', async () => {
      const idleCount = 5
      const idleBusyCount = 2
      const idleVms = makeFakeVMs(idleCount, true)
      const nonIdleCount = 10
      const nonIdleBusyCount = 6
      const nonIdleVms = makeFakeVMs(nonIdleCount, false)
      stubExternalDependencies(idleVms, idleBusyCount, nonIdleVms, nonIdleBusyCount)

      await scaleDownRunners(runnerType.temp, nonIdleCount, false)

      countFakeVmsDeleted(nonIdleVms).should.equals(nonIdleCount - nonIdleBusyCount)
      countFakeVmsDeleted(idleVms).should.equals(0)
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

function stubExternalDependencies (idleVms, idleBusyCount, nonIdleVms, nonIdleBusyCount) {
  const vms = idleVms.concat(nonIdleVms)
  const getRunnersVmsStub = sandbox.stub(getVMHelper, 'getRunnersVms')
  getRunnersVmsStub.withArgs(runnerType.idle).resolves(idleVms)
  getRunnersVmsStub.withArgs(runnerType.temp).resolves(nonIdleVms)
  sandbox.stub(deleteVmHelper, 'deleteRunner').callsFake(async vmName => {
    await vms.filter(vm => vm.name === vmName)[0].delete()
    return Promise.resolve()
  })
  const mergedGithubState = makeFakeGitHubState(idleVms, idleBusyCount).concat(makeFakeGitHubState(nonIdleVms, nonIdleBusyCount))
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

function makeFakeVMs (count, idle) {
  const vms = []
  for (let index = 0; index < count; index++) {
    const vm = {
      name: `vm-${idle}-${index}`,
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
