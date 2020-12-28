const chalk = require('chalk')
const gitHubHelper = require('./github-helper')
const getRunnerHelper = require('./get-runner-helper')
const scaleHelper = require('./scale-helper')
const scalePolicySettings = require('./scale-policy-settings')
const parser = require('cron-parser')
const googleSettings = require('./google-settings')
const moment = require('moment-timezone')

module.exports.scaleUp = scaleUp
module.exports.scaleDown = scaleDown

async function scaleUp () {
  console.log('scale up...')
  const nonBusyRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  const upRate = scalePolicySettings.upRate()
  if (nonBusyRunnersCount < upRate) {
    console.log(`non busy runners (${nonBusyRunnersCount}) < threshold (${upRate}), evaluate scale up possibility`)
    const runnersToCreateTargetCount = upRate - nonBusyRunnersCount
    const runners = await getRunnerHelper.getRunnersVms()
    const runnersCount = runners.length
    const maxRunnersCount = scalePolicySettings.upMax()
    const availableRunnersSlotForScaleUp = maxRunnersCount - runnersCount
    console.log(`runners to create to meet target count = ${runnersToCreateTargetCount}, available runners slot for scale up = ${availableRunnersSlotForScaleUp}`)
    const scaleUpCount = Math.min(runnersToCreateTargetCount, availableRunnersSlotForScaleUp)
    await scaleHelper.scaleUpRunners(scaleUpCount)
  } else {
    console.log(`non busy runners (${nonBusyRunnersCount}) >= threshold (${scalePolicySettings.upRate()}), nothing to do`)
  }
  console.log(chalk.green('scale up done'))
}

async function scaleDown () {
  console.log('scale down...')
  const nonBusyRunnersCount = await gitHubHelper.getNonBusyGcpGitHubRunnersCount()
  if (nonBusyRunnersCount > 0) {
    console.log(`non busy runners ${nonBusyRunnersCount} > 0, evaluate scale down possibility`)
    var availableRunnersForScaleDown
    if (scalePolicySettings.idleCount() > 0 && isDateInIdlePeriod(moment())) {
      availableRunnersForScaleDown = Math.max(0, nonBusyRunnersCount - scalePolicySettings.idleCount())
      console.log(`in idling range, trying to keep ${scalePolicySettings.idleCount()} idle runner(s)`)
    } else {
      availableRunnersForScaleDown = nonBusyRunnersCount
      console.log('outside idling range')
    }
    const scaleDownRate = scalePolicySettings.downRate()
    console.log(`scale down rate = ${scaleDownRate}, available runners for scale down = ${availableRunnersForScaleDown}`)
    const scaleDownCount = Math.min(availableRunnersForScaleDown, scaleDownRate)
    await scaleHelper.scaleDownRunners(scaleDownCount)
  } else {
    console.log(`non busy runners count (${nonBusyRunnersCount}) is 0, nothing to do`)
  }
  console.log(chalk.green('scale down done'))
}

function isDateInIdlePeriod (date) {
  const dateOnGivenTimeZone = date.tz(googleSettings.timezone())
  const localDateTime = dateOnGivenTimeZone.format('YYYY-MM-DD HH:mm')
  const options = {
    currentDate: localDateTime,
    tz: googleSettings.timezone()
  }
  const cronExpression = parser.parseExpression(
    scalePolicySettings.idleSchedule(),
    options
  )
  const next = moment(cronExpression.next().toDate())
  const diffMinutes = Math.abs(next.diff(date, 'minutes'))
  return diffMinutes <= 1
}
