const HealthCheckHelper = require('./healthcheck.js')
const ScaleHelper = require('./scale_helper.js')
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
    }
    return Promise.resolve('startAndStop end')
  } catch (err) {
    console.error(chalk.red(err.stack))
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  await healthCheck()
}

async function startRunners () {
  await ScaleHelper.scaleUpNonIdleRunners()
  await ScaleHelper.scaleIdleRunners()
}

async function stopRunners (force) {
  await ScaleHelper.scaleDownNonIdleRunners(force)
}

async function healthCheck () {
  await HealthCheckHelper.removeOfflineOrDanglingRunners()
}

function validatePayload (payload) {
  if (!payload.filter) {
    throw new Error('Attribute \'filter\' missing from payload')
  }
  if (!payload.action) {
    throw new Error('Attribute \'action\' missing from payload')
  }
  return payload
}
