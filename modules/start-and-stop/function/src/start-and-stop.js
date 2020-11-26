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
    if (payload.action === 'start') {
      await startRunners()
    } else if (payload.action === 'stop') {
      const force = payload.force === true
      await stopRunners(force)
    } else if (payload.action === 'healthcheck') {
      await healthCheck()
    } else if (payload.action === 'renew_idle_runners') {
      await renewIdleRunners()
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

async function startRunners () {
  await scaleHelper.scaleUpAllNonIdlesRunners()
  await scaleHelper.scaleIdleRunners()
}

async function stopRunners (force) {
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
