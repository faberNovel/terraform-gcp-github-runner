const GetVMHelper = require('./get_vm_helper.js')
const createRunnerHelper = require('./create-runner-helper')
const GitHubHelper = require('./github_helper')
const deleteVmHelper = require('./delete_vm_helper')
const chalk = require('chalk')

async function scaleIdleRunners () {
  const idle = true
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(idle, targetRunnerCountDelta)
  } else if (targetRunnerCountDelta < 0) {
    await scaleDownRunners(idle, Math.abs(targetRunnerCountDelta), true)
  } else {
    console.info(chalk.green('idle runners reached, no scale to apply'))
  }
}

async function renewIdleRunners () {
  const idle = true
  const force = true
  const targetCount = getTargetRunnersCount(idle)
  await scaleDownRunners(idle, targetCount, force)
  await scaleUpRunners(idle, targetCount)
}

async function scaleUpNonIdleRunners () {
  const idle = false
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    await scaleUpRunners(idle, targetRunnerCountDelta)
  }
}

async function scaleDownNonIdleRunners (force) {
  const idle = false
  const runnerVms = await GetVMHelper.getRunnerVMs(idle)
  await scaleDownRunners(idle, runnerVms.length, force)
}

function getTargetRunnersCount (idle) {
  if (idle) {
    return Number(process.env.RUNNER_IDLE_COUNT)
  } else {
    return process.env.RUNNER_TOTAL_COUNT - process.env.RUNNER_IDLE_COUNT
  }
}

async function getTargetRunnerCountDelta (idle) {
  const runnerVms = await GetVMHelper.getRunnerVMs(idle)
  const targetRunnersCount = getTargetRunnersCount(idle)
  console.info(`runners(idle:${idle}) : current count=${runnerVms.length} -> target count=${targetRunnersCount}`)
  const targetRunnerCountDelta = targetRunnersCount - runnerVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (idle, count) {
  console.info(`scale up runners idle:${idle} by ${count}...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = createRunnerHelper.createRunner(idle)
  }
  await Promise.all(createPromises)
  console.info(chalk.green(`scale up runners idle:${idle} by ${count} succeed`))
}

async function scaleDownRunners (idle, count, force) {
  console.info(`scale down runners idle:${idle}, force:${force}, by ${count}...`)
  const runnerVMs = await GetVMHelper.getRunnerVMs(idle)
  if (runnerVMs.length === 0) {
    console.info('runners already 0, nothing to scale down')
    return
  }
  const runnerGitHubStates = await GitHubHelper.getRunnerGitHubStates()
  const runnerVMsToDelete = runnerVMs.slice(-count)
  await Promise.all(runnerVMsToDelete.map(async (runnerVM) => {
    console.info(`trying to delete runner : ${runnerVM.name}`)
    const gitHubRunner = GitHubHelper.parseGitHubRunnerStatus(runnerGitHubStates, runnerVM.name)
    const isBusy = gitHubRunner && gitHubRunner.busy
    console.info(`GitHub runner is busy : ${isBusy}`)
    if (isBusy === true && force === false) {
      console.info(`runner busy, not deleting : ${runnerVM.name}`)
    } else {
      await deleteVmHelper.deleteVm(runnerVM.name)
    }
    Promise.resolve(`trying to delete instance end : ${runnerVM.name}`)
  }))
  console.info(chalk.green(`scale down runners idle:${idle}, force:${force} end`))
}

module.exports.scaleIdleRunners = scaleIdleRunners
module.exports.scaleUpNonIdleRunners = scaleUpNonIdleRunners
module.exports.scaleDownNonIdleRunners = scaleDownNonIdleRunners
module.exports.getTargetRunnerCountDelta = getTargetRunnerCountDelta
module.exports.scaleDownRunners = scaleDownRunners
module.exports.renewIdleRunners = renewIdleRunners
