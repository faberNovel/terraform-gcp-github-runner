const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const healthcheck = require('../src/healthcheck')
const githubHelper = require('../src/github-helper')
const deleteRunnerHelper = require('../src/delete-runner-helper')
const getRunnerHelper = require('../src/get-runner-helper')

chai.use(chaiAsPromised)
const expect = chai.expect

describe('Testing healthchecks', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('when remove offline github runners', () => {
    it('should remove offline github runner', async () => {
      const offlineRunnersCount = 3
      sandbox.stub(githubHelper, 'getOfflineGitHubRunners').resolves(generateGitHubRunners(offlineRunnersCount))
      sandbox.mock(deleteRunnerHelper).expects('deleteRunner').exactly(offlineRunnersCount)
      await healthcheck.removeOfflineGitHubRunners()
    })
  })

  describe('when remove unknown github runners', () => {
    it('should remove unknown github runner', async () => {
      const gcpRunnersCount = 4
      const gitHubRunnersCount = 2
      const gcpRunners = generateGcpRunners(gcpRunnersCount)
      const gitHubRunners = gcpRunners.slice(0, gitHubRunnersCount)
      const runnersToDelete = gcpRunners.slice(gitHubRunnersCount, gcpRunners.length)
      sandbox.stub(getRunnerHelper, 'getAllRunnersVms').resolves(gcpRunners)
      sandbox.stub(githubHelper, 'getGcpGitHubRunners').resolves(gitHubRunners)
      const deleteRunnerVmMock = sandbox.mock(deleteRunnerHelper).expects('deleteRunnerVm')
      deleteRunnerVmMock.exactly(gcpRunnersCount - gitHubRunnersCount)

      await healthcheck.removeUnknownGitHubRunners()

      runnersToDelete.forEach(runner => {
        expect(deleteRunnerVmMock.calledWith(runner.name)).to.be.true
      })
    })
  })
})

function generateRunnerName (index) {
  return `runner-${index}`
}

function generateGitHubRunners (totalCount) {
  const gitHubRunners = []
  for (let index = 0; index < totalCount; index++) {
    const gitHubRunner = {
      name: generateRunnerName(index)
    }
    gitHubRunners.push(gitHubRunner)
  }
  return gitHubRunners
}

function generateGcpRunners (totalCount) {
  const gcpRunners = []
  for (let index = 0; index < totalCount; index++) {
    const gcpRunner = {
      name: generateRunnerName(index)
    }
    gcpRunners.push(gcpRunner)
  }
  return gcpRunners
}
