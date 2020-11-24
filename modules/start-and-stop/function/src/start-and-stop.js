const healthCheckHelper = require('./healthcheck')
const scaleHelper = require('./scale-helper')
const chalk = require('chalk')

module.exports.startAndStop = async (data, context) => {
  try {
    console.info('startAndStop...')
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
    await scaleHelper.renewIdleRunners()
    console.log('ok')
  } catch (error) {
    console.log(`error = ${error}`)
  }
}

async function startRunners () {
  await scaleHelper.scaleUpNonIdleRunners()
  await scaleHelper.scaleIdleRunners()
}

async function stopRunners (force) {
  await scaleHelper.scaleDownNonIdleRunners(force)
}

async function healthCheck () {
  await healthCheckHelper.removeDisconnectedGcpRunners()
  await healthCheckHelper.removeOfflineGitHubRunners()
  await startRunners()
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
