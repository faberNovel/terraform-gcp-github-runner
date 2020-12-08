const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const healthcheck = require('../src/healthcheck')
const githubHelper = require('../src/github-helper')
const deleteRunnerHelper = require('../src/delete-runner-helper')

chai.use(chaiAsPromised)

describe('Testing healthchecks', () => {
  afterEach(function () {
    sandbox.verifyAndRestore()
  })

  describe('when remove offline github runners', () => {
    it('should remove offline github runner', async () => {
      const offlineRunnersCount = 3
      sandbox.mock(githubHelper).expects('getOfflineGitHubRunners').resolves(generateRunnersGitHub(offlineRunnersCount))
      sandbox.mock(deleteRunnerHelper).expects('deleteRunner').exactly(offlineRunnersCount)
      await healthcheck.removeOfflineGitHubRunners()
    })
  })
})

function generateRunnersGitHub (totalCount) {
  const gitHubRunners = []
  for (let index = 0; index < totalCount; index++) {
    const gitHubRunner = {
      name: `runner-${index}`
    }
    gitHubRunners.push(gitHubRunner)
  }
  return gitHubRunners
}
