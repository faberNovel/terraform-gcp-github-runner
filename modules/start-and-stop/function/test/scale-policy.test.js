const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scalePolicy = require('../src/scale-policy')
const githubHelper = require('../src/github-helper')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')

chai.should()
chai.use(chaiAsPromised)

describe('Scale policy tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When scalling up with threshold already meet', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 0)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and non idle runner slot available', () => {
    it('should scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(false, 1).once()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no non idle runner slot available', () => {
    it('should not scale up', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold - 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      scalePolicy.scaleUp()
    })
  })

  describe('When scalling down with threshold already meet', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and non idle runners online', () => {
    it('should scale down without force', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold + 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 1, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(false, 1, false).once()
      scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and no non idle runner online', () => {
    it('should not scale down', async () => {
      const nonBusyGcpGitHubRunnersCount = scalePolicy.nonBusyThreshold + 1
      stubExternalDependencies(nonBusyGcpGitHubRunnersCount, 0, 1)
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      scalePolicy.scaleDown()
    })
  })
})

function stubExternalDependencies (nonBusyRunnersCount, nonIdleRunnersCount, maxNonIdleRunnersCount) {
  sandbox.stub(githubHelper, 'getNonBusyGcpGitHubRunnersCount').resolves(nonBusyRunnersCount)
  const idle = false
  const nonIdleRunners = []
  for (let index = 0; index < nonIdleRunnersCount; index++) {
    const vm = {
      name: `vm-${index}`
    }
    nonIdleRunners.push(vm)
  }
  sandbox.stub(getRunnerHelper, 'getRunnersVms').withArgs(idle).resolves(nonIdleRunners)
  sandbox.stub(scaleHelper, 'getTargetRunnersCount').withArgs(idle).returns(maxNonIdleRunnersCount)
}
