const Compute = require('@google-cloud/compute')
const Fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const chalk = require('chalk')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)
const githubHelper = require('./github-helper.js')
const pWaitFor = require('p-wait-for')
const utils = require('./utils')
const runnerType = require('./runner-type')

module.exports.createRunner = createRunner
module.exports.getRunnerNamePrefix = getRunnerNamePrefix

async function createRunner (type) {
  const runnerName = createRunnerName(type)
  console.info(`start create runner ${runnerName}...`)
  const vm = await createRunnerVm(runnerName, type)
  await waitForRunnerConnectedToGitHub(vm, type)
  console.info(chalk.green(`runner ${vm.name} created, up, and connected to GitHub`))
  return vm
}

function getRunnerNamePrefix (type) {
  switch (type) {
    case runnerType.idle:
    case runnerType.temp:
      return `vm-gcp-${process.env.GOOGLE_ENV}`
    case runnerType.ghost:
      return `vm-gcp-ghost-${process.env.GOOGLE_ENV}`
    default:
      throw new Error(`Invalid runner type ${type}`)
  }
}

function createRunnerName (type) {
  return `${getRunnerNamePrefix(type)}-${uuidv4()}`
}

async function createRunnerVm (runnerName, type) {
  const createVmPromise = zone.createVM(runnerName, createVmConfig(type, process.env.GOOGLE_ENV))
  utils.logPromise(createVmPromise, `create runner ${runnerName} VM (type:${type})`)
  const [vm] = await createVmPromise

  const awaitRunningStatePromise = vm.waitFor('RUNNING')
  utils.logPromise(awaitRunningStatePromise, `waiting runner ${vm.name} VM to be in RUNNING State`)
  await awaitRunningStatePromise

  return vm
}

async function waitForRunnerConnectedToGitHub (vm, type) {
  let status
  switch (type) {
    case runnerType.idle:
    case runnerType.temp:
      status = 'online'
      break
    case runnerType.ghost:
      status = 'offline'
      break
    default:
      throw new Error(`Invalid runner type ${type}`)
  }
  const githubApiConnectionPromise = pWaitFor(
    () => githubHelper.checkGitHubRunnerStatus(vm.name, status),
    {
      interval: 10_000,
      timeout: 60_000 * 2
    }
  )
  utils.logPromise(githubApiConnectionPromise, `waiting runner ${vm.name} to have status ${status} on GitHub API`)
  await githubApiConnectionPromise
}

function createVmConfig (type, env) {
  const startScript = Fs.readFileSync('runner-scripts/start-script.sh', 'utf8')
  const stopScript = Fs.readFileSync('runner-scripts/stop-script.sh', 'utf8')
  const config = {
    machineType: process.env.RUNNER_MACHINE_TYPE,
    http: true,
    disks: [
      {
        boot: true,
        autoDelete: true,
        initializeParams: {
          sourceImage: `https://www.googleapis.com/compute/v1/projects/${process.env.GOOGLE_PROJECT}/global/images/debian-runner`
        }
      }
    ],
    networkInterfaces: [
      {
        network: 'global/networks/default'
      }
    ],
    labels: {
      type: type,
      env: env
    },
    serviceAccounts: [
      {
        email: process.env.RUNNER_SERVICE_ACCOUNT,
        scopes: [
          'https://www.googleapis.com/auth/cloud-platform'
        ]
      }
    ],
    metadata: {
      items: [
        {
          value: process.env.GITHUB_API_TRIGGER_URL,
          key: 'github-api-trigger-url'
        },
        {
          value: process.env.GITHUB_ORG,
          key: 'github-org'
        },
        {
          value: process.env.RUNNER_TAINT_LABELS,
          key: 'taint-labels'
        },
        {
          value: startScript,
          key: 'startup-script'
        },
        {
          value: stopScript,
          key: 'shutdown-script'
        }
      ]
    }
  }
  return config
}
