const gitHubHelper = require('./github-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const scaleHelper = require('./scale-helper')
const createRunnerHelper = require('./create-runner-helper')
const runnerType = require('./runner-type')
const getRunnerHelper = require('./get-runner-helper')
const chalk = require('chalk')

module.exports.healthChecks = healthChecks
module.exports.removeOfflineGitHubRunners = removeOfflineGitHubRunners
module.exports.removeUnknownGitHubRunners = removeUnknownGitHubRunners
module.exports.createGhostRunnerIfNeeded = createGhostRunnerIfNeeded

async function healthChecks () {
  await removeOfflineGitHubRunners()
  await removeUnknownGitHubRunners()
  await createGhostRunnerIfNeeded()
}

async function removeOfflineGitHubRunners () {
  console.info('remove offline github runner(s)...')
  const offlineGcpGitHubRunners = await gitHubHelper.getOfflineGitHubRunners()
  console.info(`${offlineGcpGitHubRunners.length} GitHub runner(s) offline`)
  await Promise.all(offlineGcpGitHubRunners.map(async offlineGitHubRunner => {
    await deleteRunnerHelper.deleteRunner(offlineGitHubRunner.name)
  }))
  console.info(chalk.green('remove offline github runner(s) end'))
}

async function removeUnknownGitHubRunners () {
  console.info('remove unknown GitHub runners...')
  const gitHubRunners = await gitHubHelper.getGcpGitHubRunners()
  const gitHubRunnersNames = new Set(gitHubRunners.map(gitHubRunner => gitHubRunner.name))
  const gcpRunners = await getRunnerHelper.getAllRunnersVms()
  const gcpRunnersNames = gcpRunners.map(gcpRunner => gcpRunner.name)
  const unknownRunnersNames = gcpRunnersNames.filter(runnerName => !gitHubRunnersNames.has(runnerName))
  console.log(`found ${unknownRunnersNames.length} unknown runners (${JSON.stringify(unknownRunnersNames)})`)
  await Promise.all(unknownRunnersNames.map(async unknownRunnerName => {
    await deleteRunnerHelper.deleteRunnerVm(unknownRunnerName)
  }))
  console.info(chalk.green('remove unknown GitHub runner()s end'))
}

async function createGhostRunnerIfNeeded () {
  console.info('create ghost runner if needed...')
  const targetIdleRunnerCount = scaleHelper.getTargetRunnersCount(runnerType.idle)
  if (targetIdleRunnerCount > 0) {
    console.info(chalk.green(`idle count ${targetIdleRunnerCount} > 0, no ghost runner needed`))
    return
  }
  console.info('ghost runner needed')
  const ghostRunnerExists = await gitHubHelper.gitHubGhostRunnerExists()
  if (ghostRunnerExists) {
    console.info(chalk.green('ghost runner exist, nothing to do'))
    return
  }
  const ghostRunnerVm = await createRunnerHelper.createRunner(runnerType.ghost)
  await deleteRunnerHelper.deleteRunnerVm(ghostRunnerVm.name)
  console.info(chalk.green('ghost runner created'))
}
