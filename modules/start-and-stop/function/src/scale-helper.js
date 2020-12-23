const getRunnerHelper = require('./get-runner-helper')
const createRunnerHelper = require('./create-runner-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const gitHubHelper = require('./github-helper')
const chalk = require('chalk')
const runnerType = require('./runner-type')
const scalePolicySettings = require('./scale-policy-settings')

module.exports.scaleUpAllRunners = scaleUpAllRunners
module.exports.scaleDownAllRunners = scaleDownAllRunners
module.exports.getRunnersDeltaToMaxCount = getRunnersDeltaToMaxCount
module.exports.scaleUpRunners = scaleUpRunners
module.exports.scaleDownRunners = scaleDownRunners

async function scaleUpAllRunners () {
  console.info('scale up all runners...')
  const targetRunnerCountDelta = await getRunnersDeltaToMaxCount()
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(targetRunnerCountDelta)
  }
  console.info(chalk.green('scale up all runners succeed'))
}

async function scaleDownAllRunners () {
  console.info('scale down all runners...')
  const runnerVms = await getRunnerHelper.getRunnersVms()
  await scaleDownRunners(runnerVms.length)
  console.info(chalk.green('scale down all runners succeed'))
}

async function getRunnersDeltaToMaxCount () {
  const runnersVms = await getRunnerHelper.getRunnersVms()
  const targetRunnersCount = scalePolicySettings.runnersMaxCount()
  const targetRunnerCountDelta = targetRunnersCount - runnersVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (count) {
  console.info(`scale up ${count} runners...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = createRunnerHelper.createRunner(runnerType.default)
  }
  await Promise.all(createPromises)
  console.info(chalk.green(`scale up ${count} runners succeed`))
}

async function scaleDownRunners (count) {
  console.info(`scale down ${count} runners...`)
  const runnersVms = await getRunnerHelper.getRunnersVms()
  const gcpGitHubRunners = await gitHubHelper.getGcpGitHubRunners()
  const gcpFilteredGitHubRunners = gcpGitHubRunners.filter(gitHubRunner => {
    return runnersVms.map(vm => vm.name).includes(gitHubRunner.name)
  })
  const nonBusyFilteredGcpGitHubRunners = gcpFilteredGitHubRunners.filter(gitHubRunner => {
    return gitHubRunner.busy === false
  })
  const runnersToDelete = nonBusyFilteredGcpGitHubRunners.slice(-count)
  console.info(`${runnersToDelete.length} non busy gcp runner(s) to delete`)
  await Promise.all(runnersToDelete.map(async (gitHubRunner) => {
    await deleteRunnerHelper.deleteRunner(gitHubRunner.name)
  }))
  console.info(chalk.green(`scale down ${count} runners succeed`))
}
