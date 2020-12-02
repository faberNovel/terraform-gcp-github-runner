const getRunnerHelper = require('./get-runner-helper')
const createRunnerHelper = require('./create-runner-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const gitHubHelper = require('./github-helper')
const chalk = require('chalk')

module.exports.scaleIdleRunners = scaleIdleRunners
module.exports.scaleUpAllNonIdlesRunners = scaleUpAllNonIdlesRunners
module.exports.scaleDownAllNonIdlesRunners = scaleDownAllNonIdlesRunners
module.exports.getTargetRunnersCount = getTargetRunnersCount
module.exports.getTargetRunnerCountDelta = getTargetRunnersCountDelta
module.exports.scaleUpRunners = scaleUpRunners
module.exports.scaleDownRunners = scaleDownRunners

async function scaleIdleRunners () {
  console.info('scale idle runners...')
  const idle = true
  const targetRunnerCountDelta = await getTargetRunnersCountDelta(idle)
  console.info(`${targetRunnerCountDelta} idle(s) runner(s) to change`)
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(idle, targetRunnerCountDelta)
  } else if (targetRunnerCountDelta < 0) {
    await scaleDownRunners(idle, Math.abs(targetRunnerCountDelta), true)
  }
  console.info(chalk.green('scale idle runners succeed'))
}

async function scaleUpAllNonIdlesRunners () {
  console.info('scale up all non idle runners...')
  const idle = false
  const targetRunnerCountDelta = await getTargetRunnersCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(idle, targetRunnerCountDelta)
  }
  console.info(chalk.green('scale up all non idle runners succeed'))
}

async function scaleDownAllNonIdlesRunners (force) {
  console.info('scale down all non idle runners...')
  const idle = false
  const runnerVms = await getRunnerHelper.getRunnersVms(idle)
  await scaleDownRunners(idle, runnerVms.length, force)
  console.info(chalk.green('scale down all non idle runners succeed'))
}

function getTargetRunnersCount (idle) {
  if (idle) {
    return Number(process.env.RUNNER_IDLE_COUNT)
  } else {
    return process.env.RUNNER_TOTAL_COUNT - process.env.RUNNER_IDLE_COUNT
  }
}

async function getTargetRunnersCountDelta (idle) {
  const runnersVms = await getRunnerHelper.getRunnersVms(idle)
  const targetRunnersCount = getTargetRunnersCount(idle)
  const targetRunnerCountDelta = targetRunnersCount - runnersVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (idle, count) {
  console.info(`scale up ${count} runners (idle:${idle})...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = createRunnerHelper.createRunner(idle)
  }
  await Promise.all(createPromises)
  console.info(chalk.green(`scale up ${count} runners (idle:${idle}) succeed`))
}

async function scaleDownRunners (idle, count, force) {
  console.info(`scale down ${count} runners (idle:${idle}, force:${force})...`)
  const runnersVms = await getRunnerHelper.getRunnersVms(idle)
  if (force) {
    const runnersVmsToDelete = runnersVms.slice(-count)
    await Promise.all(runnersVmsToDelete.map(async (runnerVM) => {
      await deleteRunnerHelper.deleteRunner(runnerVM.name)
    }))
  } else {
    const gcpGitHubRunners = await gitHubHelper.getGcpGitHubRunners()
    const gcpIdleFilteredGitHubRunners = gcpGitHubRunners.filter(gitHubRunner => {
      return runnersVms.map(vm => vm.name).includes(gitHubRunner.name)
    })
    const nonBusyIdleFilteredGcpGitHubRunners = gcpIdleFilteredGitHubRunners.filter(gitHubRunner => {
      return gitHubRunner.busy === false
    })
    const runnersToDelete = nonBusyIdleFilteredGcpGitHubRunners.slice(-count)
    console.info(`${runnersToDelete.length} non busy gcp runner(s) (idle:${idle}) to delete`)
    await Promise.all(runnersToDelete.map(async (gitHubRunner) => {
      await deleteRunnerHelper.deleteRunner(gitHubRunner.name)
    }))
  }
  console.info(chalk.green(`scale down ${count} runners (idle:${idle}, force:${force}) succeed`))
}
