const GitHubHelper = require('./github_helper')
const CreateVMHelper = require('./create_vm_helper.js')
const GetVMHelper = require('./get_vm_helper.js')
const chalk = require('chalk')

module.exports.removeDisconnectedGcpRunners = async function () {
  console.info('Searching disconnected gcp runners...')
  const vms = await GetVMHelper.getAllRunnerVMs()
  const runnerGitHubStates = await GitHubHelper.getRunnerGitHubStates()
  const disconnectedVMs = vms.filter(vm => {
    const isConnected = runnerGitHubStates.map(it => it.name).includes(vm.id)
    return !isConnected
  })
  if (disconnectedVMs.length > 0) {
    console.warn(chalk.yellow(`Found ${disconnectedVMs.length} disconnected runners found`))
    await Promise.all(disconnectedVMs.map(async function (it) {
      console.info(`Deleting ${it.id}`)
      await it.delete()
      console.info(`Waiting TERMINATED state of ${it.id}`)
    }))
    console.info(chalk.green('Disconnected gcp runners deleted'))
  } else {
    console.info(chalk.green('No disconnected gcp runners found'))
  }
}

module.exports.removeOfflineGitHubRunners = async function () {
  console.info('Searching github offline gcp runners...')
  const offlineGcpRunnerGitHubStates = await getOfflineGcpRunnerGitHubStates()
  console.info(`Found ${offlineGcpRunnerGitHubStates.length} offline GitHub runner(s) ${offlineGcpRunnerGitHubStates.map(it => it.name)}`)
  const danglingVMs = await getDanglingGcpVMs(offlineGcpRunnerGitHubStates)
  console.info(`Found ${danglingVMs.length} dangling GCP runner(s) ${danglingVMs.map(it => it.metadata.name)}`)
  if (danglingVMs.length > 0) {
    console.warn(chalk.yellow('Delete dangling GCP runners...'))
    await Promise.all(danglingVMs.map(it => it.delete()))
    console.info(chalk.green('Delete dangling GCP runners with success'))
  } else {
    console.info(chalk.green('No dangling GCP runner to delete'))
  }
  if (offlineGcpRunnerGitHubStates.length > 0) {
    console.warn(chalk.yellow('Delete offline GitHub runners...'))
    const offlineGcpRunnerGitHubStatesIds = offlineGcpRunnerGitHubStates.map(it => it.id)
    await Promise.all(offlineGcpRunnerGitHubStatesIds.map(it => GitHubHelper.deleteRunnerGitHub(it)))
    console.info(chalk.green('Delete offline GitHub runners with success'))
  } else {
    console.info(chalk.green('No offline GitHub runner to delete'))
  }
}

async function getDanglingGcpVMs (offlineGcpRunnerGitHubStates) {
  const vms = await GetVMHelper.getAllRunnerVMs()
  const danglingVMs = vms.filter(function (vm) {
    return offlineGcpRunnerGitHubStates.map(gh => gh.name).includes(vm.metadata.name)
  })
  return danglingVMs
}

async function getOfflineGcpRunnerGitHubStates () {
  const runnerGitHubStates = await GitHubHelper.getRunnerGitHubStates()
  const gcpRunnerGitHubStates = runnerGitHubStates.filter(function (runnerGitHubState) {
    return runnerGitHubState.name.startsWith(CreateVMHelper.getRunnerNamePrefix())
  })
  const offlineGcpRunnerGitHubStates = gcpRunnerGitHubStates.filter(function (gcpRunnerGitHubState) {
    return gcpRunnerGitHubState.status === 'offline'
  })
  return offlineGcpRunnerGitHubStates
}
