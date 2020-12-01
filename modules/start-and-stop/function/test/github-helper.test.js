const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const githubHelper = require('../src/github-helper')
const { expect } = require('chai')

chai.should()
chai.use(chaiAsPromised)

describe('Testing github helper', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('when getting runner github busy state', () => {
    it('should return runner busy state', async () => {
      const runner = githubHelper.filterGitHubRunner(generateRunnersGitHub(1, 2), 'runner-0')
      const isBusy = runner && runner.busy
      isBusy.should.equals(true)
    })
  })
  describe('when getting unknown runner github status, null is returned', () => {
    it('should return null', async () => {
      const runner = githubHelper.filterGitHubRunner(generateRunnersGitHub(0, 1), 'unknown-runner')
      expect(runner).to.be.null
    })
  })
  describe('When get non busy gcp gitHub runners count', () => {
    it('should return the correct count', async () => {
      const busyRunnersCount = 1
      const totalRunnersCount = 3
      sandbox.stub(githubHelper, 'getGcpGitHubRunners').resolves(generateRunnersGitHub(busyRunnersCount, totalRunnersCount))
      githubHelper.getNonBusyGcpGitHubRunnersCount().should.eventually.equals(totalRunnersCount - busyRunnersCount)
    })
  })
})

function generateRunnersGitHub (busyCount, totalCount) {
  const gitHubRunners = []
  for (let index = 0; index < totalCount; index++) {
    const busy = index < busyCount
    const gitHubRunner = {
      name: `runner-${index}`,
      status: 'online',
      busy: busy
    }
    gitHubRunners.push(gitHubRunner)
  }
  return gitHubRunners
}
