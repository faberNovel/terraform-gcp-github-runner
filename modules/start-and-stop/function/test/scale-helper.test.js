const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')
const scaleHelper = rewire('../src/scale-helper')
const createRunnerHelper = require('../src/create-runner-helper')
const gitHubHelper = require('../src/github-helper')
const getVMHelper = require('../src/get-runner-helper')
const deleteVmHelper = require('../src/delete-runner-helper')

chai.should()
chai.use(chaiAsPromised)

describe('Scale helper tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When calling scale up runners', () => {
    it('should scale up runners', async () => {
      const scaleUpRunners = scaleHelper.__get__('scaleUpRunners')
      const idle = false
      const count = 3
      const stub = sandbox.stub(createRunnerHelper, 'createRunner').returns(Promise.resolve())

      await scaleUpRunners(idle, count)

      stub.getCalls().map(it => {
        const idleParam = it.args[0]
        idleParam.should.equals(idle)
      })
      stub.getCalls().length.should.equals(count)
    })
  })

  describe('When calling scale down runners', () => {
    const scaleDownRunners = scaleHelper.__get__('scaleDownRunners')

    it('should scale down runners when force is used', async () => {
      const idle = false
      const count = 2
      const busyCount = 2
      const force = true
      const vms = makeFakeVMs(count)
      stubExternalDependencies(vms, busyCount)

      await scaleDownRunners(idle, count, force)

      countFakeVmsDeleted(vms).should.equals(count)
    })

    it('should scale down runners according github status when force is not used', async () => {
      const idle = false
      const count = 2
      const busyCount = 1
      const force = false
      const vms = makeFakeVMs(count)
      stubExternalDependencies(vms, busyCount)

      await scaleDownRunners(idle, count, force)

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

  describe('When get non busy gcp gitHub runners count', () => {
    it('should return the correct count', async () => {
      const runnersCount = 3
      const vms = makeFakeVMs(runnersCount)
      const busyCount = 1
      stubExternalDependencies(vms, busyCount)
      scaleHelper.getNonBusyGcpGitHubRunnersCount().should.eventually.equals(runnersCount - busyCount)
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
  sandbox.stub(getVMHelper, 'getRunnersVms').resolves(vms)
  sandbox.stub(deleteVmHelper, 'deleteRunner').callsFake(async vmName => {
    await vms.filter(vm => vm.name === vmName)[0].delete()
    return Promise.resolve()
  })
  const vmsCount = vms.length
  const mergedGithubState = []
  for (let index = 0; index < vmsCount; index++) {
    const busy = index < busyCount
    const gitHubRunnerState = {
      name: vms[index].name,
      status: 'online',
      busy: busy
    }
    mergedGithubState.push(gitHubRunnerState)
  }
  sandbox.stub(gitHubHelper, 'getGcpGitHubRunners').resolves(mergedGithubState)
  sandbox.stub(gitHubHelper, 'getGitHubRunners').resolves(mergedGithubState)
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
