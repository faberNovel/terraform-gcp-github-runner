const Compute = require('@google-cloud/compute')
const Fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

module.exports.createVm = async function createVm (isIdle) {
  console.log('create VM ...')
  const [vm, operation] = await zone.createVM(createVmName(), createVmConfig(isIdle, process.env.GOOGLE_ENV))
  console.log(vm)
  console.log('Creating VM ...')
  await operation.promise()
  console.log('VM created')
  return vm
}

function createVmName () {
  const runnerId = uuidv4()
  const vmName = `vm-gcp-${process.env.GOOGLE_ENV}-${runnerId}`
  console.log(`vm name created : ${vmName}`)
  return vmName
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
  console.log(`vm config created : ${config}`)
  return config
}
