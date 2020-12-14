const scaleHelper = require('./scale-helper')
const getRunnerHelper = require('./get-runner-helper')
const deleteRunnerHelper = require('./delete-runner-helper')
const scalePolicy = require('./scale-policy')
const chalk = require('chalk')

module.exports.renewRunners = renewRunners

async function renewRunners () {
  console.info('renew runners...')
  const agedRunnersVms = await getRunnerHelper.getAgedRunnersVms()
  console.info(`Found ${agedRunnersVms.length} aged runners`)
  await Promise.all(agedRunnersVms.map(async (agedRunnerVm) => {
    await deleteRunnerHelper.deleteRunner(agedRunnerVm.name)
  }))
  await scaleHelper.scaleIdleRunners() // Ensure min number of idle runner
  await scalePolicy.scaleUp() // Ensure min number of temp runner
  console.info(chalk.green('runners renewed'))
}
