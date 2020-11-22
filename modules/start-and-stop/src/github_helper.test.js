const chai = require('chai')
const githubHelper = require('./github_helper.js')
const { expect } = require('chai')

chai.should()

describe('Testing github helper', () => {
  describe('when getting runner github busy state', () => {
    it('should return runner busy state', async () => {
      const runnerName = 'busy-runner'
      const runner = githubHelper.parseGitHubRunnerStatus(generateRunnersGitHub(), runnerName)
      const isBusy = runner && runner.busy
      isBusy.should.equals(true)
    })
  })
  describe('when getting unknown runner github status, null is returned', () => {
    it('should return null', async () => {
      const runner = githubHelper.parseGitHubRunnerStatus(generateRunnersGitHub(), 'unknown-runner')
      expect(runner).to.be.null
    })
  })
})

function generateRunnersGitHub () {
  return [
    {
      name: 'busy-runner',
      status: 'online',
      busy: true
    },
    {
      name: 'idle-runner',
      status: 'online',
      busy: false
    }
  ]
}
