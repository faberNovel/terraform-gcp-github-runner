const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiString = require('chai-string')
const sandbox = require('sinon').createSandbox()

const deleteRunnerHelper = require('../src/delete-runner-helper')
const githubHelper = require('../src/github-helper')
const getRunnerHelper = require('../src/get-runner-helper')

chai.use(chaiAsPromised)
chai.use(chaiString)
chai.should()

describe('Testing delete runner helper', () => {
  describe('When delete a runner with happy path expectations', () => {
    it('should resolves', async () => {
      const runnerName = 'runner'
      const runnerGitHubId = 'gitHubRunnerId'
      const runnerGitHubStatus = {
        id: runnerGitHubId
      }
      const runnerVm = {
        name: 'runnerVm',
        exists: async function () { return [false] },
        delete: async function () {}
      }

      const gitHubHelperMock = sandbox.mock(githubHelper)
      gitHubHelperMock.expects('getRunnerGitHubStateByName').withExactArgs(runnerName).resolves(runnerGitHubStatus).once()
      gitHubHelperMock.expects('deleteRunnerGitHub').withExactArgs(runnerGitHubId).resolves().once()

      const mockVm = sandbox.mock(runnerVm)
      mockVm.expects('delete').resolves().once()
      const getRunnerHelperMock = sandbox.mock(getRunnerHelper)
      getRunnerHelperMock.expects('getRunnerVmByName').withExactArgs(runnerName).resolves(runnerVm).once()

      await deleteRunnerHelper.deleteRunner(runnerName)

      sandbox.verifyAndRestore()
    })
  })
})
