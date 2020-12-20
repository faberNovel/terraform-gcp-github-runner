const getRunnerHelper = require('./get-runner-helper')
const createRunnerHelper = require('./create-runner-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const gitHubHelper = require('./github-helper')
const chalk = require('chalk')
const runnerType = require('./runner-type')

module.exports.scaleUpAllTempRunners = scaleUpAllTempRunners
module.exports.scaleDownAllTempRunners = scaleDownAllTempRunners
module.exports.getTargetRunnersCount = getTargetRunnersCount
module.exports.getTargetRunnerCountDelta = getTargetRunnersCountDelta
module.exports.scaleUpRunners = scaleUpRunners
module.exports.scaleDownRunners = scaleDownRunners

async function scaleUpAllTempRunners () {
  console.info('scale up all temp runners...')
  const type = runnerType.temp
  const targetRunnerCountDelta = await getTargetRunnersCountDelta(type)
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(type, targetRunnerCountDelta)
  }
  console.info(chalk.green('scale up all temp runners succeed'))
}

async function scaleDownAllTempRunners () {
  console.info('scale down all temp runners...')
  const type = runnerType.temp
  const runnerVms = await getRunnerHelper.getRunnersVms(type)
  await scaleDownRunners(type, runnerVms.length)
  console.info(chalk.green('scale down all temp runners succeed'))
}

function getTargetRunnersCount () {
  return process.env.RUNNER_TOTAL_COUNT
}

async function getTargetRunnersCountDelta (type) {
  const runnersVms = await getRunnerHelper.getRunnersVms(type)
  const targetRunnersCount = getTargetRunnersCount(type)
  const targetRunnerCountDelta = targetRunnersCount - runnersVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (type, count) {
  console.info(`scale up ${count} runners (type:${type})...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = createRunnerHelper.createRunner(type)
  }
  await Promise.all(createPromises)
  console.info(chalk.green(`scale up ${count} runners (type:${type}) succeed`))
}

async function scaleDownRunners (type, count) {
  console.info(`scale down ${count} runners (type:${type})...`)
  const runnersVms = await getRunnerHelper.getRunnersVms(type)
  const gcpGitHubRunners = await gitHubHelper.getGcpGitHubRunners()
  const gcpFilteredGitHubRunners = gcpGitHubRunners.filter(gitHubRunner => {
    return runnersVms.map(vm => vm.name).includes(gitHubRunner.name)
  })
  const nonBusyFilteredGcpGitHubRunners = gcpFilteredGitHubRunners.filter(gitHubRunner => {
    return gitHubRunner.busy === false
  })
  const runnersToDelete = nonBusyFilteredGcpGitHubRunners.slice(-count)
  console.info(`${runnersToDelete.length} non busy gcp runner(s) (type:${type}) to delete`)
  await Promise.all(runnersToDelete.map(async (gitHubRunner) => {
    await deleteRunnerHelper.deleteRunner(gitHubRunner.name)
  }))
  console.info(chalk.green(`scale down ${count} runners (type:${type}) succeed`))
}
