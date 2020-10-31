const chai = require('chai')
const githubHelper = require('./github_helper.js')
const { expect } = require('chai')

chai.should()

describe('Testing github helper', () => {
  describe('when getting runner github status', () => {
    it('should return runner status', async () => {
      const runnerName = 'runner'
      const runnerStatus = 'busy'
      const status = githubHelper.getRunnerGitHubStateByName(generateRunnersGitHub(runnerName, runnerStatus), runnerName)
      status.should.equals(runnerStatus)
    })
  })
  describe('when getting unknown runner github status, undefined is returned', () => {
    it('should return undefined', async () => {
      const runnerName = 'runner'
      const runnerStatus = 'busy'
      const status = githubHelper.getRunnerGitHubStateByName(generateRunnersGitHub(runnerName, runnerStatus), 'azerty')
      expect(status).to.be.undefined
    })
  })
})

function generateRunnersGitHub (runnerName, runnerStatus) {
  return [
    {
      name: runnerName,
      status: runnerStatus
    },
    {
      name: `${runnerName}-1`,
      status: `${runnerStatus}-1`
    }
  ]
}
