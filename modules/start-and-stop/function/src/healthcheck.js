const gitHubHelper = require('./github-helper')
const createRunnerHelper = require('./create-runner-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const chalk = require('chalk')

module.exports.getOfflineGitHubRunners = getOfflineGitHubRunners
module.exports.removeOfflineGitHubRunners = removeOfflineGitHubRunners

async function removeOfflineGitHubRunners () {
  console.info('remove offline github runners...')
  const offlineGcpGitHubRunners = await getOfflineGitHubRunners()
  console.info(`${offlineGcpGitHubRunners.length} GitHub runner(s) offline`)
  await Promise.all(offlineGcpGitHubRunners.map(async offlineGitHubRunner => {
    await deleteRunnerHelper.deleteRunner(offlineGitHubRunner.name)
  }))
  console.info(chalk.green('remove offline github end'))
}

async function getOfflineGitHubRunners () {
  const githubRunners = await gitHubHelper.getGitHubRunners()
  const gcpGitHubRunners = githubRunners.filter(gitHubRunner => {
    return gitHubRunner.name.startsWith(createRunnerHelper.getRunnerNamePrefix())
  })
  const offlineGcpGitHubRunners = gcpGitHubRunners.filter(gcpGitHubRunner => {
    return gcpGitHubRunner.status === 'offline'
  })
  return offlineGcpGitHubRunners
}
