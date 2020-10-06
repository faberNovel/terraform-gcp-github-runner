const Compute = require('@google-cloud/compute')
const { GoogleAuth } = require('google-auth-library')
const CreateVMHelper = require('./create_vm_helper.js')
const compute = new Compute()
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
  // stopRunners(true)
}

async function startRunners () {
  await scaleUpNonIdleRunners()
  await scaleIdleRunners()
}

async function stopRunners (force) {
  await scaleDownNonIdleRunners(force)
}

async function scaleUpNonIdleRunners () {
  const idle = false
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    scaleUpRunners(idle, targetRunnerCountDelta)
  }
}

async function scaleIdleRunners () {
  const idle = true
  const targetRunnerCountDelta = await getTargetRunnerCountDelta(idle)
  if (targetRunnerCountDelta > 0) {
    scaleUpRunners(idle, targetRunnerCountDelta)
  } else if (targetRunnerCountDelta < 0) {
    scaleDownRunners(idle, Math.abs(targetRunnerCountDelta), true)
  } else {
    console.log('idle runners reached, no scale to apply')
  }
}

async function scaleDownNonIdleRunners (force) {
  const idle = false
  const runnerVms = await getRunnerVMs(idle)
  scaleDownRunners(idle, runnerVms.length, force)
}

async function getRunnerVMs (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

function getTargetRunnersCount (idle) {
  if (idle) {
    return Number(process.env.RUNNER_IDLE_COUNT)
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
    createPromises[i] = CreateVMHelper.createVm(idle)
  }
  await Promise.all(createPromises)
  console.log(`scale up runners idle:${idle} by ${count} succeed`)
}

async function scaleDownRunners (idle, count, force) {
  console.log(`scale down runners idle:${idle}, force:${force}, by ${count}...`)
  const runnerVMs = await getRunnerVMs(idle)
  if (runnerVMs.length === 0) {
    console.info('runners already 0, nothing to scale down')
    return
  }
  const runnerGitHubStates = await getRunnerGitHubStates()
  const runnerVMsToDelete = runnerVMs.slice(-count)
  await Promise.all(runnerVMsToDelete.map(async (runnerVM) => {
    console.log(`trying to delete runner : ${runnerVM.name}`)
    const githubStatus = getRunnerGitHubStateByName(runnerGitHubStates, runnerVM.name)
    console.log(`GitHub status of runner : ${githubStatus}`)
    if (githubStatus === 'busy' && force === false) {
      console.log(`runner busy, not deleting : ${runnerVM.name}`)
    } else {
      console.log(`deleting instance : ${runnerVM.name}`)
      await runnerVM.delete()
    }
    Promise.resolve(`trying to delete instance end : ${runnerVM.name}`)
  }))
  console.log(`scale down runners idle:${idle}, force:${force} end`)
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
  if (githubRunner === undefined) {
    return undefined
  }
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
