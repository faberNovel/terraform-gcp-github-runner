const Compute = require('@google-cloud/compute')
const GithubHelper = require('./github-helper.js')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

/* global ORG */

module.exports.startAndStop = async (data, context) => {
  try {
    console.log('startAndStop...')
    const payload = _validatePayload(
      JSON.parse(Buffer.from(data.data, 'base64').toString())
    )
    const vms = await getInstances(payload.filter)
    if (payload.action === 'start') {
      await startInstances(vms)
    } else if (payload.action === 'stop') {
      const force = payload.force === true
      await stopInstances(vms, force)
    }
    return Promise.resolve('startAndStop end')
  } catch (err) {
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  const vm = await createVm(true, '1')
  console.log('deleting VM ...')
  const [operation] = await vm.delete()
  await operation.promise()
  console.log('VM deleted')
}

async function createVm (isIdle, id) {
  console.log('create VM ...')
  const [vm, operation] = await zone.createVM(createVmName(id), createVmConfig(isIdle, process.env.GOOGLE_ENV))
  console.log(vm)
  console.log('Creating VM ...')
  await operation.promise()
  console.log('VM created')
  return vm
}

function createVmName (runnerId) {
  const vmName = `vm-gcp-github-action-runner-${process.env.GOOGLE_ENV}-${runnerId}`
  console.log(`vm name created : ${vmName}`)
  return vmName
}

function createVmConfig (isIdle, env) {
  const config = {
    machineType: process.env.RUNNER_MACHINE_TYPE,
    http: true,
    disks: [
      {
        boot: true,
        autoDelete: true,
        initializeParams: {
          diskSizeGb: '40',
          sourceImage: 'https://www.googleapis.com/compute/v1/projects/ubuntu-os-cloud/global/images/family/ubuntu-2004-lts'
        }
      }
    ],
    networkInterfaces: [
      {
        network: 'global/networks/default'
      }
    ],
    labels: {
      idle: isIdle,
      env: env
    },
    serviceAccounts: [
      {
        email: process.env.RUNNER_SERVICE_ACCOUNT,
        scopes: [
          'https://www.googleapis.com/auth/cloud-platform'
        ]
      }
    ]
  }
  console.log(`vm config created : ${config}`)
  return config
}

async function getInstances (filter) {
  console.log(`looking for instance(s) with filter ${filter}...`)
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  console.log(`Found ${vms.length} VMs!`)
  return vms
}

async function startInstances (vms) {
  console.log('Starting instance(s)')
  await Promise.all(vms.map(async (vm) => {
    console.log(`Starting instance : ${vm.name}`)
    await vm.start()
    Promise.resolve('instance started')
  }))
  console.log('Successfully started instance(s)')
}

async function stopInstances (vms, force) {
  console.log(`Stopping instance(s), force = ${force}`)
  const runnersGitHubStatus = await getRunnersGitHubStatus()
  console.log(`runners github status = ${JSON.stringify(runnersGitHubStatus)}`)
  await Promise.all(vms.map(async (vm) => {
    console.log(`Trying to stop instance : ${vm.name}`)
    const githubStatus = getRunnerGitHubStatusByName(runnersGitHubStatus, vm.name)
    console.log(`GitHub status of instance : ${githubStatus}`)
    if (githubStatus === 'busy' && force === false) {
      console.log(`Instance busy, not stopping : ${vm.name}`)
    } else {
      console.log(`Stopping instance : ${vm.name}`)
      await vm.stop()
    }
    Promise.resolve(`trying to stopping instance end : ${vm.name}`)
  }))
  console.log('Finishing stopping stopped instance(s)')
}

async function getRunnersGitHubStatus () {
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.listSelfHostedRunnersForOrg({
    org: ORG
  })
  return response.data.runners
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
