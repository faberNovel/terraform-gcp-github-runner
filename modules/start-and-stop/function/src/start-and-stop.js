const healthCheckHelper = require('./healthcheck')
const scaleHelper = require('./scale-helper')
const chalk = require('chalk')

module.exports.startAndStop = async (data, context) => {
  try {
    console.info('startAndStop...')
    const eventDate = new Date(Date.parse(context.timestamp))
    const payload = JSON.parse(Buffer.from(data.data, 'base64').toString())
    console.info(`Receive event with payload ${JSON.stringify(payload)} and date ${eventDate.toISOString()}`)

    if (isEventAgeTooOld(eventDate)) {
      const eventAgeMs = Date.now().getTime() - eventDate.getTime()
      console.info(`Dropping event with age ${eventAgeMs} ms.`)
      return Promise.resolve('startAndStop ignored too old event')
    }

    if (!isPayloadValid(payload)) {
      console.info(`Payload ${payload} is invalid.`)
      return Promise.resolve('startAndStop ignored invalid payload')
    }

    const action = payload.action
    switch (action) {
      case 'create_all_non_idle_runners':
        await createAllNonIdleRunners()
        break
      case 'delete_all_non_idle_runners':
        await deleteAllNonIdleRunners(false)
        break
      case 'force_delete_all_non_idle_runners':
        await deleteAllNonIdleRunners(true)
        break
      case 'healthcheck':
        await healthCheck()
        break
      case 'renew_idle_runners':
        await renewIdleRunners()
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

module.exports.dev = async () => {
  try {
    // await healthCheck()
    await scaleHelper.renewIdleRunners()
    console.log('ok')
  } catch (error) {
    console.log(`error = ${error}`)
  }
}

async function createAllNonIdleRunners () {
  await scaleHelper.scaleUpAllNonIdlesRunners()
}

async function deleteAllNonIdleRunners (force) {
  await scaleHelper.scaleDownAllNonIdlesRunners(force)
}

async function healthCheck () {
  await healthCheckHelper.removeOfflineGitHubRunners()
}

async function renewIdleRunners () {
  await scaleHelper.renewIdleRunners()
}

function isPayloadValid (payload) {
  return payload.action
}

function isEventAgeTooOld (eventDate) {
  const eventAgeMs = Date.now() - eventDate.getTime()
  const eventMaxAgeMs = 1000 * 60 * 10 // 10 minutes
  return eventAgeMs > eventMaxAgeMs
}
