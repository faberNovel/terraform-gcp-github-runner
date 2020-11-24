const githubHelper = require('./github-helper.js')
const pWaitFor = require('p-wait-for')
const getVmHelper = require('./get-runner-helper.js')

async function deleteVm (vmName) {
  console.info(`delete runner ${vmName}`)
  const githubStatus = await githubHelper.getRunnerGitHubStateByName(vmName)
  if (githubStatus !== null) {
    console.info('directly removing runner to block new job to be assigned to the runner')
    try {
      await githubHelper.deleteRunnerGitHub(githubStatus.id)
    } catch (error) {
      console.error(error)
    }
  }
  const vm = await getVmHelper.getRunnerVMByName(vmName)
  console.info(`delete runner ${vmName} vm...`)
  await vm.delete()
  console.info(`runner ${vmName} is deleted, waiting it does not exist anymore`)
  await pWaitFor(
    () => vmDoesNotExist(vm),
    {
      interval: 5_000,
      timeout: 60_000
    }
  )
  console.info(`runner ${vmName} does not exists anymore`)
}

async function vmDoesNotExist (vm) {
  const [exists] = await vm.exists()
  console.info(`vm ${vm.name} exists = ${exists}`)
  return Promise.resolve(!exists)
}

module.exports.deleteVm = deleteVm
