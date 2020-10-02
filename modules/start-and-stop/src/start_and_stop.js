const Compute = require('@google-cloud/compute')
const { GoogleAuth } = require('google-auth-library')
const CreateVMHelper = require('./create_vm_helper.js')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)
const auth = new GoogleAuth()

module.exports.startAndStop = async (data, context) => {
  try {
    console.log('startAndStop...')
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
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  console.info(await getRunnerGitHubStates())
  startRunners()
/*
  const vm = await createVm(true, '1')
  console.log('deleting VM ...')
  const [operation] = await vm.delete()
  await operation.promise()
  console.log('VM deleted')
  */
}

async function getRunnerVMs (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  console.log(`looking for runner VM(s) with filter : ${filter}`)
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  console.log(`found ${vms.length} runners VMs with filder : ${filter}`)
  return vms
}

async function startRunners () {
  // TODO : Ensure idle runners are running + start non idle runners
  scaleIdleRunners()
}

async function stopRunners (vms, force) {
  // TODO : Stop and delete non idle runners
}

async function scaleIdleRunners () {
  console.log('start scaling idle runners ...')
  const idleRunners = await getRunnerVMs(true)
  const targetIdleRunnersCount = process.env.RUNNER_IDLE_COUNT
  const idleRunnerDelta = targetIdleRunnersCount - idleRunners.length
  console.log(`target idle runners count : ${targetIdleRunnersCount}, current idle runners count : ${idleRunners.length}`)
  if (idleRunnerDelta < 0) {
    console.log(`idle runners in excess, reducing idle runners by ${Math.abs(idleRunnerDelta)}`)
    const deletePromises = []
    for (let i = 0; i < Math.abs(idleRunnersDelta); i++) {
      deletePromises[i] = idleRunners[i].delete()
    }
    console.log(deletePromises)
    await Promise.all(deletePromises)
    console.log('reducing idle runners succeed')
  } else if (idleRunnerDelta > 0) {
    console.log(`not enough idle runners, increasing idle runners by ${idleRunnerDelta}`)
    const createPromises = []
    for (let i = 0; i < idleRunnerDelta; i++) {
      createPromises[i] = CreateVMHelper.createVm(true)
    }
    console.log(createPromises)
    await Promise.all(createPromises)
    console.log('increasing idle runners succeed')
  } else {
    console.log('consistent idle runners count detected')
  }
}

async function getRunnerGitHubStates () {
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

function getRunnerGitHubStateByName (githubRunners, name) {
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === name
  })
  return githubRunner.status
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
