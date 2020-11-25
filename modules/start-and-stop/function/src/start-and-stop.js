const healthCheckHelper = require('./healthcheck')
const scaleHelper = require('./scale-helper')
const chalk = require('chalk')

module.exports.startAndStop = async (data, context) => {
  try {
    console.info('startAndStop...')

    const eventAge = Date.now() - Date.parse(context.timestamp)
    const eventMaxAge = 1000 * 60 * 10 // 10 minutes
    console.info(`Event date = ${context.timestamp}, age = ${eventAge} ms`)
    // Ignore events that are too old
    if (eventAge > eventMaxAge) {
      console.info(`Dropping event ${data} with age ${eventAge} ms.`)
      return Promise.resolve('startAndStop ignored too old event')
    }

    const payload = validatePayload(
      JSON.parse(Buffer.from(data.data, 'base64').toString())
    )
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

function validatePayload (payload) {
  if (!payload.action) {
    throw new Error('Attribute \'action\' missing from payload')
  }
  return payload
}
