const scaleHelper = require('./scale-helper')
const getRunnerHelper = require('./get-runner-helper')
const chalk = require('chalk')
const runnerType = require('./runner-type')

module.exports.renewRunners = renewRunners

async function renewRunners () {
  console.info('renew runners...')
  const force = true
  const idleRunnerType = runnerType.idle
  const currentIdleRunners = await getRunnerHelper.getRunnersVms(idleRunnerType)
  const currentIdleRunnersCount = currentIdleRunners.length
  const targetCount = scaleHelper.getTargetRunnersCount(idleRunnerType)
  await scaleHelper.scaleDownRunners(idleRunnerType, currentIdleRunnersCount, force)
  await scaleHelper.scaleUpRunners(idleRunnerType, targetCount)
  await scaleHelper.scaleDownAllTempRunners(force)
  console.info(chalk.green('runners renewed'))
}
