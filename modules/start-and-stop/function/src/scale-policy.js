const chalk = require('chalk')
const gitHubHelper = require('./github-helper')
const getRunnerHelper = require('./get-runner-helper')
const scaleHelper = require('./scale-helper')

const nonBusyThreshold = 1

module.exports.scaleUp = scaleUp
module.exports.scaleDown = scaleDown
module.exports.nonBusyThreshold = nonBusyThreshold

async function scaleUp () {
  console.log('scale up...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount < nonBusyThreshold) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) < threshold (${nonBusyThreshold}), evaluate scale up possibility`)
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
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) >= threshold (${nonBusyThreshold}), nothing to do`)
  }
  console.log(chalk.green('scale up done'))
}

async function scaleDown () {
  console.log('scale down...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount > nonBusyThreshold) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) > threshold (${nonBusyThreshold}), evaluate scale down possibility`)
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
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) <= threshold (${nonBusyThreshold}), nothing to do`)
  }
  console.log(chalk.green('scale down done'))
}
