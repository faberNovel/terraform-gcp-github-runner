const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scalePolicy = require('../src/scale-policy')
const githubHelper = require('../src/github-helper')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')
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
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyRunnersTargetCount()
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, { runnersMaxCount: 0, scaleDownNonBusyRunnersChunckSize: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no runner slot available', () => {
    it('should scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyRunnersTargetCount() - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, { runnersMaxCount: 1, scaleDownNonBusyRunnersChunckSize: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(1).once()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no runner slot available', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicySettings.scaleUpNonBusyRunnersTargetCount() - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, { runnersMaxCount: 1, scaleDownNonBusyRunnersChunckSize: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(0).once()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling down with threshold already meet', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = 0
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, { runnersMaxCount: 1, scaleDownNonBusyRunnersChunckSize: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and runners online count > scaleDownMaxCount', () => {
    it('should scale down according scaleDownMaxCount setting', async () => {
      const scaleDownMaxCount = 3
      const nonBusyGcpGitHubRunnersCount = 6
      stubExternalDependencies(
        nonBusyGcpGitHubRunnersCount,
        nonBusyGcpGitHubRunnersCount,
        { runnersMaxCount: nonBusyGcpGitHubRunnersCount, scaleDownNonBusyRunnersChunckSize: scaleDownMaxCount }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(scaleDownMaxCount).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and runners online count < scaleDownMaxCount', () => {
    it('should scale down according available runner count', async () => {
      const scaleDownMaxCount = 3
      const nonBusyGcpGitHubRunnersCount = 2
      stubExternalDependencies(
        nonBusyGcpGitHubRunnersCount,
        nonBusyGcpGitHubRunnersCount,
        { runnersMaxCount: nonBusyGcpGitHubRunnersCount, scaleDownNonBusyRunnersChunckSize: scaleDownMaxCount }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(nonBusyGcpGitHubRunnersCount).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and no runner online', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, { runnersMaxCount: 1, scaleDownNonBusyRunnersChunckSize: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(0).once()
      scalePolicy.scaleDown()
    })
  })
})

function stubExternalDependencies (nonBusyRunnersCount, runnersCount, scalePolicyCustomSettings) {
  const scalePolicyDefaultSettings = {
    runnersMaxCount: 1,
    scaleDownNonBusyRunnersChunckSize: 1
  }
  const scalePolicyMergedSettings = { ...scalePolicyDefaultSettings, ...(scalePolicyCustomSettings || {}) }
  sandbox.stub(githubHelper, 'getNonBusyGcpGitHubRunnersCount').resolves(nonBusyRunnersCount)
  const runners = []
  for (let index = 0; index < runnersCount; index++) {
    const vm = {
      name: `vm-${index}`
    }
    runners.push(vm)
  }
  sandbox.stub(getRunnerHelper, 'getRunnersVms').resolves(runners)
  sandbox.stub(scalePolicySettings, 'runnersMaxCount').returns(scalePolicyMergedSettings.runnersMaxCount)
  sandbox.stub(scalePolicySettings, 'scaleDownNonBusyRunnersChunckSize').returns(scalePolicyMergedSettings.scaleDownNonBusyRunnersChunckSize)
}
