const gitHubHelper = require('./github-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const scaleHelper = require('./scale-helper')
const createRunnerHelper = require('./create-runner-helper')
const runnerType = require('./runner-type')
const chalk = require('chalk')

module.exports.getOfflineGitHubRunners = getOfflineGitHubRunners
module.exports.removeOfflineGitHubRunners = removeOfflineGitHubRunners
module.exports.createGhostRunnerIfNeeded = createGhostRunnerIfNeeded

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

async function createGhostRunnerIfNeeded () {
  console.info('create ghost runner if needed...')
  if (scaleHelper.getTargetRunnersCount(true) > 0) {
    console.info('idle count > 0, no ghost runner needed')
    return
  }
  console.info('ghost runner needed')
  const ghostRunnerExists = await gitHubHelper.gitHubGhostRunnerExists()
  if (ghostRunnerExists) {
    console.info('ghost runner exist, nothing to do')
    return
  }
  const ghostRunnerVm = await createRunnerHelper.createGhostRunner()
  await deleteRunnerHelper.deleteRunnerVm(ghostRunnerVm.name)
  console.info(chalk.green('ghost runner created'))
}
