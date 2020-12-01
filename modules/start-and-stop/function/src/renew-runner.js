const scaleHelper = require('./scale-helper')
const getRunnerHelper = require('./get-runner-helper')
const chalk = require('chalk')

module.exports.renewIdleRunners = renewIdleRunners

async function renewIdleRunners () {
  console.info('renew idle runners...')
  const idle = true
  const force = true
  const currentIdleRunners = await getRunnerHelper.getRunnersVms(idle)
  const currentIdleRunnersCount = currentIdleRunners.length
  const targetCount = scaleHelper.getTargetRunnersCount(idle)
  await scaleHelper.scaleDownRunners(idle, currentIdleRunnersCount, force)
  await scaleHelper.scaleUpRunners(idle, targetCount)
  console.info(chalk.green('idle runners renewed'))
}
