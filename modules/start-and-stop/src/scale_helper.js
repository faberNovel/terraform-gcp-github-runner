const GetVMHelper = require('./get_vm_helper.js')
const CreateVMHelper = require('./create_vm_helper.js')
const GitHubHelper = require('./github_helper')

module.exports.scaleIdleRunners = async function scaleIdleRunners () {
  const idle = true
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    scaleUpRunners(idle, targetRunnerCountDelta)
  } else if (targetRunnerCountDelta < 0) {
    scaleDownRunners(idle, Math.abs(targetRunnerCountDelta), true)
  } else {
    console.log('idle runners reached, no scale to apply')
  }
}

module.exports.scaleUpNonIdleRunners = async function scaleUpNonIdleRunners () {
  const idle = false
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    scaleUpRunners(idle, targetRunnerCountDelta)
  }
}

module.exports.scaleDownNonIdleRunners = async function scaleDownNonIdleRunners (force) {
  const idle = false
  const runnerVms = await GetVMHelper.getRunnerVMs(idle)
  scaleDownRunners(idle, runnerVms.length, force)
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
  console.log(`runners idle:${idle}, target count=${targetRunnersCount}, current count=${runnerVms.length}`)
  const targetRunnerCountDelta = targetRunnersCount - runnerVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (idle, count) {
  console.log(`scale up runners idle:${idle} by ${count}...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = CreateVMHelper.createVm(idle)
  }
  await Promise.all(createPromises)
  console.log(`scale up runners idle:${idle} by ${count} succeed`)
}

async function scaleDownRunners (idle, count, force) {
  console.log(`scale down runners idle:${idle}, force:${force}, by ${count}...`)
  const runnerVMs = await GetVMHelper.getRunnerVMs(idle)
  if (runnerVMs.length === 0) {
    console.info('runners already 0, nothing to scale down')
    return
  }
  const runnerGitHubStates = await GitHubHelper.getRunnerGitHubStates()
  const runnerVMsToDelete = runnerVMs.slice(-count)
  await Promise.all(runnerVMsToDelete.map(async (runnerVM) => {
    console.log(`trying to delete runner : ${runnerVM.name}`)
    const githubStatus = GitHubHelper.getRunnerGitHubStateByName(runnerGitHubStates, runnerVM.name)
    console.log(`GitHub status of runner : ${githubStatus}`)
    if (githubStatus === 'busy' && force === false) {
      console.log(`runner busy, not deleting : ${runnerVM.name}`)
    } else {
      console.log(`deleting instance : ${runnerVM.name}`)
      await runnerVM.delete()
    }
    Promise.resolve(`trying to delete instance end : ${runnerVM.name}`)
  }))
  console.log(`scale down runners idle:${idle}, force:${force} end`)
}
