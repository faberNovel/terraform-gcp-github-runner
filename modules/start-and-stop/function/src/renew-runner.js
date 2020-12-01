const scaleHelper = require('./scale-helper')
const chalk = require('chalk')

module.exports.renewIdleRunners = renewIdleRunners

async function renewIdleRunners () {
  console.info('renew idle runners...')
  const idle = true
  const force = true
  const targetCount = scaleHelper.getTargetRunnersCount(idle)
  await scaleHelper.scaleDownRunners(idle, targetCount, force)
  await scaleHelper.scaleUpRunners(idle, targetCount)
  console.info(chalk.green('idle runners renewed'))
}
