const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scalePolicy = require('../src/scale-policy')
const githubHelper = require('../src/github-helper')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')
const runnerType = require('../src/runner-type')
const scalePolicySettings = require('../src/scale-policy-settings')

chai.should()
chai.use(chaiAsPromised)

describe('Scale policy tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When scalling up with threshold already meet', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyTargetCount()
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 0, scalePolicySettings.scaleDownMaxCount())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and non idle runner slot available', () => {
    it('should scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyTargetCount() - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1, scalePolicySettings.scaleDownMaxCount())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(runnerType.temp, 1).once()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no non idle runner slot available', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyTargetCount() - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1, scalePolicySettings.scaleDownMaxCount())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling down with threshold already meet', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleDownNonBusyTargetCount()
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1, scalePolicySettings.scaleDownMaxCount())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and non idle runners online count > scaleDownMaxCount', () => {
    it('should scale down according scaleDownMaxCount setting', async () => {
      const scaleDownMaxCount = 3
      const nonBusyGcpGitHubRunnersCount = 6
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, nonBusyGcpGitHubRunnersCount, nonBusyGcpGitHubRunnersCount, scaleDownMaxCount)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(runnerType.temp, scaleDownMaxCount).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and non idle runners online count < scaleDownMaxCount', () => {
    it('should scale down according available runner count', async () => {
      const scaleDownMaxCount = 3
      const nonBusyGcpGitHubRunnersCount = 2
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, nonBusyGcpGitHubRunnersCount, nonBusyGcpGitHubRunnersCount, scaleDownMaxCount)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(runnerType.temp, nonBusyGcpGitHubRunnersCount).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and no non idle runner online', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleDownNonBusyTargetCount() + 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })
})

function stubExternalDependencies (nonBusyRunnersCount, tempRunnersCount, maxTempRunnersCount, scaleDownMaxCount) {
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
  sandbox.stub(scalePolicySettings, 'scaleDownMaxCount').returns(scaleDownMaxCount)
}
