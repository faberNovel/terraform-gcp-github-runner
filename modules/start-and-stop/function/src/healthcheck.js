const gitHubHelper = require('./github-helper')
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
  const gcpGitHubRunners = await gitHubHelper.getGcpGitHubRunners()
  const offlineGcpGitHubRunners = gcpGitHubRunners.filter(gcpGitHubRunner => {
    return gcpGitHubRunner.status === 'offline'
  })
  return offlineGcpGitHubRunners
}
