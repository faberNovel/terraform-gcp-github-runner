const chalk = require('chalk')
const gitHubHelper = require('./github-helper')
const getRunnerHelper = require('./get-runner-helper')
const scaleHelper = require('./scale-helper')
const runnerType = require('./runner-type')
const scalePolicySettings = require('./scale-policy-settings')

module.exports.scaleUp = scaleUp
module.exports.scaleDown = scaleDown

async function scaleUp () {
  console.log('scale up...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount < scalePolicySettings.scaleUpNonBusyTargetCount()) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) < threshold (${scalePolicySettings.scaleUpNonBusyTargetCount()}), evaluate scale up possibility`)
    const runnerTypeTemp = runnerType.temp
    const tempRunners = await getRunnerHelper.getRunnersVms(runnerTypeTemp)
    const tempRunnersCount = tempRunners.length
    const maxTempRunnersCount = scaleHelper.getTargetRunnersCount(runnerTypeTemp)
    console.log(`temp runners count is ${tempRunnersCount}, max is ${maxTempRunnersCount}`)
    if (tempRunnersCount < maxTempRunnersCount) {
      console.log('max temp runners count is not meet, scaling up')
      await scaleHelper.scaleUpRunners(runnerTypeTemp, 1)
    } else {
      console.log('max temp runners count is already meet, can not scale up more')
    }
  } else {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) >= threshold (${scalePolicySettings.scaleUpNonBusyTargetCount()}), nothing to do`)
  }
  console.log(chalk.green('scale up done'))
}

async function scaleDown () {
  console.log('scale down...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount > scalePolicySettings.scaleDownNonBusyTargetCount()) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) > threshold (${scalePolicySettings.scaleDownNonBusyTargetCount()}), evaluate scale down possibility`)
    const runnerTypeTemp = runnerType.temp
    const tempRunners = await getRunnerHelper.getRunnersVms(runnerTypeTemp)
    const tempRunnersCount = tempRunners.length
    console.log(`temp runners count is ${tempRunnersCount}, min is 0`)
    if (tempRunnersCount > 0) {
      const scaleDownCount = Math.min(tempRunnersCount, scalePolicySettings.scaleDownMaxCount())
      console.log(`temp runners count is > 0, scaling down by ${scaleDownCount}`)
      await scaleHelper.scaleDownRunners(runnerTypeTemp, scaleDownCount)
    } else {
      console.log('temp runners count is 0, can not scale down more')
    }
  } else {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) <= threshold (${scalePolicySettings.scaleDownNonBusyTargetCount()}), nothing to do`)
  }
  console.log(chalk.green('scale down done'))
}
