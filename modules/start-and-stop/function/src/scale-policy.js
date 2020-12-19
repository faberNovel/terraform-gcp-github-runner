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
  const scaleUpNonBusyRunnersTargetCount = scalePolicySettings.scaleUpNonBusyRunnersTargetCount()
  if (nonBusyGcpGitHubRunnersCount < scaleUpNonBusyRunnersTargetCount) {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) < threshold (${scaleUpNonBusyRunnersTargetCount}), evaluate scale up possibility`)
    const runnersToCreateTargetCount = scaleUpNonBusyRunnersTargetCount - nonBusyGcpGitHubRunnersCount
    const runnerTypeTemp = runnerType.temp
    const tempRunners = await getRunnerHelper.getRunnersVms(runnerTypeTemp)
    const tempRunnersCount = tempRunners.length
    const maxTempRunnersCount = scaleHelper.getTargetRunnersCount(runnerTypeTemp)
    const availableRunnersSlotForScaleUp = maxTempRunnersCount - tempRunnersCount
    console.log(`runners to create to meet target count = ${runnersToCreateTargetCount}, available runners slot for scale up = ${availableRunnersSlotForScaleUp}`)
    const scaleUpCount = Math.min(runnersToCreateTargetCount, availableRunnersSlotForScaleUp)
    await scaleHelper.scaleUpRunners(runnerTypeTemp, scaleUpCount)
  } else {
    console.log(`non busy runners (${nonBusyGcpGitHubRunnersCount}) >= threshold (${scalePolicySettings.scaleUpNonBusyRunnersTargetCount()}), nothing to do`)
  }
  console.log(chalk.green('scale up done'))
}

async function scaleDown () {
  console.log('scale down...')
  const nonBusyGcpGitHubRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyGcpGitHubRunnersCount > 0) {
    console.log(`non busy runners ${nonBusyGcpGitHubRunnersCount} > 0, evaluate scale down possibility`)
    const runnerTypeTemp = runnerType.temp
    const tempRunners = await getRunnerHelper.getRunnersVms(runnerTypeTemp)
    const tempRunnersCount = tempRunners.length
    const scaleDownNonBusyRunnersChunckSize = scalePolicySettings.scaleDownNonBusyRunnersChunckSize()
    console.log(`scale down non busy runners chunck size = ${scaleDownNonBusyRunnersChunckSize}, available runners for scale down = ${tempRunnersCount}`)
    const scaleDownCount = Math.min(tempRunnersCount, scaleDownNonBusyRunnersChunckSize)
    await scaleHelper.scaleDownRunners(runnerTypeTemp, scaleDownCount)
  } else {
    console.log(`non busy runners count (${nonBusyGcpGitHubRunnersCount}) is 0, nothing to do`)
  }
  console.log(chalk.green('scale down done'))
}
