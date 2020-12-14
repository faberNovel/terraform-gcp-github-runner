const healthCheckHelper = require('./healthcheck')
const scaleHelper = require('./scale-helper')
const scalePolicy = require('./scale-policy')
const renewRunnerHelper = require('./renew-runner')
const chalk = require('chalk')

module.exports.startAndStop = startAndStop
module.exports.dev = dev
module.exports.isPayloadValid = isPayloadValid
module.exports.isEventAgeTooOld = isEventAgeTooOld

async function startAndStop (data, context) {
  try {
    console.info('startAndStop...')
    const eventDate = new Date(Date.parse(context.timestamp))
    const payload = JSON.parse(Buffer.from(data.data, 'base64').toString())
    console.info(`Receive event with payload ${JSON.stringify(payload)} and date ${eventDate.toISOString()}`)

    if (isEventAgeTooOld(eventDate)) {
      const eventAgeMs = Date.now() - eventDate.getTime()
      console.info(`Dropping event with age ${eventAgeMs} ms.`)
      return Promise.resolve('startAndStop ignored too old event')
    }

    if (!isPayloadValid(payload)) {
      console.info(`Payload ${payload} is invalid.`)
      return Promise.resolve('startAndStop ignored invalid payload')
    }

    const action = payload.action
    switch (action) {
      case 'create_all_temp_runners':
        await createAllTempRunners()
        break
      case 'delete_all_temp_runners':
        await deleteAllTempRunners()
        break
      case 'healthcheck':
        await healthCheck()
        break
      case 'renew_runners':
        await renewRunners()
        break
      case 'scale_up':
        await scaleUp()
        break
      case 'scale_down':
        await scaleDown()
        break
      default:
        console.error(`action ${action} is unknown, nothing done`)
    }
    return Promise.resolve('startAndStop end')
  } catch (err) {
    console.error(chalk.red(err.stack))
    return Promise.reject(err)
  }
}

async function dev () {
  try {
    await renewRunnerHelper.renewRunners()
  } catch (error) {
    console.error(chalk.red(JSON.stringify(error)))
    console.error(chalk.red(error.stack))
  }
}

async function scaleUp () {
  await scalePolicy.scaleUp()
}

async function scaleDown () {
  await scalePolicy.scaleDown()
}

async function createAllTempRunners () {
  await scaleHelper.scaleUpAllTempRunners()
}

async function deleteAllTempRunners () {
  await scaleHelper.scaleDownAllTempRunners()
}

async function healthCheck () {
  await healthCheckHelper.healthChecks()
}

async function renewRunners () {
  await renewRunnerHelper.renewRunners()
}

function isPayloadValid (payload) {
  if (payload.action !== null && payload.action !== undefined) {
    return true
  } else {
    return false
  }
}

function isEventAgeTooOld (eventDate) {
  const eventAgeMs = Date.now() - eventDate.getTime()
  const eventMaxAgeMs = 1000 * 60 * 10 // 10 minutes
  return eventAgeMs > eventMaxAgeMs
}
