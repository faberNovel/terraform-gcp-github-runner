const Compute = require('@google-cloud/compute')
const { GoogleAuth } = require('google-auth-library')
const CreateVMHelper = require('./create_vm_helper.js')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)
const auth = new GoogleAuth()

module.exports.startAndStop = async (data, context) => {
  try {
    console.log('startAndStop...')
    const payload = _validatePayload(
      JSON.parse(Buffer.from(data.data, 'base64').toString())
    )
    if (payload.action === 'start') {
      await startInstances()
    } else if (payload.action === 'stop') {
      const force = payload.force === true
      await stopInstances(force)
    }
    return Promise.resolve('startAndStop end')
  } catch (err) {
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  console.info(await getRunnersGitHubStatus())

  const vm = await createVm(true, '1')
  console.log('deleting VM ...')
  const [operation] = await vm.delete()
  await operation.promise()
  console.log('VM deleted')
}

async function getInstances (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  console.log(`looking for instance(s) with filder : ${filter}`)
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  console.log(`Found ${vms.length} VMs`)
  return vms
}

async function startInstances () {
  // TODO : Ensure idle runners are running + start non idle runners
  scaleIdleRunners()
}

async function stopInstances (vms, force) {
  // TODO : Stop and delete non idle runners
}

async function scaleIdleRunners () {
  const idleRunners = await getInstances(true)
  const targetIdleRunnersCount = process.env.RUNNER_IDLE_COUNT
  const idleRunnerDelta = targetIdleRunnersCount - idleRunners.length
  if (idleRunnerDelta < 0) {
    console.log('idle runners in excess, reducing idle runners')
  } else if (idleRunnerDelta > 0) {
    console.log(`not enough idle runners, increasing idle runners by ${idleRunnerDelta}`)
    const createPromises = []
    for (let i = 0; i < idleRunnerDelta; i++) {
      createPromises[i] = CreateVMHelper.createVm(true)
    }
    console.log(createPromises)
    await Promise.all(createPromises)
    console.log('increasing idle runners with succeed')
  } else {
    console.log('consistent idle runners count detected')
  }
}

async function getRunnersGitHubStatus () {
  const githubApiFunctionUrl = process.env.GITHUB_API_TRIGGER_URL
  const client = await auth.getIdTokenClient(githubApiFunctionUrl)
  const res = await client.request({
    url: githubApiFunctionUrl,
    method: 'POST',
    data: {
      scope: 'actions',
      function: 'listSelfHostedRunnersForOrg',
      params: {
        org: process.env.GITHUB_ORG
      }
    }
  })
  return res.data.runners
}

function getRunnerGitHubStatusByName (githubRunners, name) {
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === name
  })
  return githubRunner.status
}

/**
 * Validates that a request payload contains the expected fields.
 *
 * @param {!object} payload the request payload to validate.
 * @return {!object} the payload object.
 */
const _validatePayload = (payload) => {
  if (!payload.filter) {
    throw new Error('Attribute \'filter\' missing from payload')
  }
  if (!payload.action) {
    throw new Error('Attribute \'action\' missing from payload')
  }
  return payload
}
