const chalk = require('chalk')
const gitHubHelper = require('./github-helper')
const getRunnerHelper = require('./get-runner-helper')
const scaleHelper = require('./scale-helper')

const scaleUpNonBusyTargetCount = process.env.RUNNER_SCALE_UP_NON_BUSY_TARGET_COUNT
const scaleDownNonBusyTargetCount = process.env.RUNNER_SCALE_DOWN_NON_BUSY_TARGET_COUNT

module.exports.scaleUp = scaleUp
module.exports.scaleDown = scaleDown
module.exports.scaleUpNonBusyTargetCount = scaleUpNonBusyTargetCount
module.exports.scaleDownNonBusyTargetCount = scaleDownNonBusyTargetCount

async function scaleUp () {
  console.log('scale up...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount < scaleUpNonBusyTargetCount) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) < threshold (${scaleUpNonBusyTargetCount}), evaluate scale up possibility`)
    const idle = false
    const nonIdleRunners = await getRunnerHelper.getRunnersVms(idle)
    const nonIdleRunnersCount = nonIdleRunners.length
    const maxNonIdleRunnersCount = scaleHelper.getTargetRunnersCount(idle)
    console.log(`non idle runners count is ${nonIdleRunnersCount}, max is ${maxNonIdleRunnersCount}`)
    if (nonIdleRunnersCount < maxNonIdleRunnersCount) {
      console.log('max non idle runners count is not meet, scaling up')
      await scaleHelper.scaleUpRunners(idle, 1)
    } else {
      console.log('max non idle runners count is already meet, can not scale up more')
    }
  } else {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) >= threshold (${scaleUpNonBusyTargetCount}), nothing to do`)
  }
  console.log(chalk.green('scale up done'))
}

async function scaleDown () {
  console.log('scale down...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount > scaleDownNonBusyTargetCount) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) > threshold (${scaleDownNonBusyTargetCount}), evaluate scale down possibility`)
    const idle = false
    const nonIdleRunners = await getRunnerHelper.getRunnersVms(idle)
    const nonIdleRunnersCount = nonIdleRunners.length
    console.log(`non idle runners count is ${nonIdleRunnersCount}, min is 0`)
    if (nonIdleRunnersCount > 0) {
      console.log('non idle runners count is > 0, scaling down')
      const force = false
      await scaleHelper.scaleDownRunners(idle, 1, force)
    } else {
      console.log('non idle runners count is 0, can not scale down more')
    }
  } else {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) <= threshold (${scaleDownNonBusyTargetCount}), nothing to do`)
  }
  console.log(chalk.green('scale down done'))
}
