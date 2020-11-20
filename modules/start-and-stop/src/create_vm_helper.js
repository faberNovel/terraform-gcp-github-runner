const Compute = require('@google-cloud/compute')
const Fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const chalk = require('chalk')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

async function createVm (isIdle) {
  console.info(`create idle:${isIdle} VM ...`)
  const [vm, operation] = await zone.createVM(createVmName(), createVmConfig(isIdle, process.env.GOOGLE_ENV))
  await operation.promise()
  console.info(chalk.green(`VM ${vm.name} created`))
  return vm
}

function getRunnerNamePrefix () {
  return `vm-gcp-${process.env.GOOGLE_ENV}`
}

function createVmName () {
  return `${getRunnerNamePrefix()}-${uuidv4()}`
}

function createVmConfig (isIdle, env) {
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

module.exports.createVm = createVm
module.exports.getRunnerNamePrefix = getRunnerNamePrefix
