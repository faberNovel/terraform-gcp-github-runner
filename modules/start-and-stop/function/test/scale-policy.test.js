const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scalePolicy = require('../src/scale-policy')
const githubHelper = require('../src/github-helper')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')
const runnerType = require('../src/runner-type')

chai.should()
chai.use(chaiAsPromised)

describe('Scale policy tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When scalling up with threshold already meet', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleUpNonBusyTargetCount
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 0)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and non idle runner slot available', () => {
    it('should scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleUpNonBusyTargetCount - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(runnerType.temp, 1).once()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no non idle runner slot available', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleUpNonBusyTargetCount - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling down with threshold already meet', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleDownNonBusyTargetCount
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and non idle runners online', () => {
    it('should scale down without force', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleDownNonBusyTargetCount + 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(runnerType.temp, 1, false).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and no non idle runner online', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.scaleDownNonBusyTargetCount + 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })
})

function stubExternalDependencies (nonBusyRunnersCount, tempRunnersCount, maxTempRunnersCount) {
  sandbox.stub(githubHelper, 'getNonBusyGcpGitHubRunnersCount').resolves(nonBusyRunnersCount)
  const type = runnerType.temp
  const tempRunners = []
  for (let index = 0; index < tempRunnersCount; index++) {
    const vm = {
      name: `vm-${index}`
    }
    tempRunners.push(vm)
  }
  sandbox.stub(getRunnerHelper, 'getRunnersVms').withArgs(type).resolves(tempRunners)
  sandbox.stub(scaleHelper, 'getTargetRunnersCount').withArgs(type).returns(maxTempRunnersCount)
}
