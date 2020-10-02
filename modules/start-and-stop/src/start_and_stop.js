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

function getTargetRunnersCount (idle) {
  if (idle) {
    return process.env.RUNNER_IDLE_COUNT
  } else {
    return process.env.RUNNER_TOTAL_COUNT - process.env.RUNNER_IDLE_COUNT
  }
}

async function getTargetRunnerCountDelta (idle) {
  const runnerVms = await getRunnerVMs(idle)
  const targetRunnersCount = getTargetRunnersCount(idle)
  console.log(`runners idle:${idle}, target count=${targetRunnersCount}, current count=${runnerVms.length}`)
  const targetRunnerCountDelta = targetRunnersCount - runnerVms.length
  return targetRunnerCountDelta
}

async function scaleUpRunners (idle, count) {
  console.log(`scale up runners idle:${idle} by ${count}...`)
  const createPromises = []
  for (let i = 0; i < count; i++) {
    createPromises[i] = CreateVMHelper.createVm(true)
  }
  await Promise.all(createPromises)
  console.log(`scale up runners idle:${idle} by ${count} succeed`)
}

async function scaleDownRunners (idle, count) {
  console.log(`scale down runners idle:${idle} by ${count}...`)
  const deletePromises = []
  for (let i = 0; i < count; i++) {
    deletePromises[i] = idleRunners[i].delete()
  }
  await Promise.all(deletePromises)
  console.log(`scale down runners idle:${idle} by ${count} succeed`)
}

async function scaleIdleRunners () {
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(true)
  if (targetRunnerCountDelta > 0) {
    scaleUpRunners(true, targetRunnerCountDelta)
  } else if (targetRunnerCountDelta < 0) {
    scaleDownRunners(true, Math.abs(targetRunnerCountDelta))
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
