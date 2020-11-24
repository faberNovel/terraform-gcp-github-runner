const githubHelper = require('./github-helper')
const pWaitFor = require('p-wait-for')
const getRunnerHelper = require('./get-runner-helper')
const utils = require('./utils')
const chalk = require('chalk')

module.exports.deleteRunner = deleteRunner

async function deleteRunner (runnerName) {
  console.info(`start delete runner ${runnerName}...`)
  await deleteRunnerFromGitHub(runnerName)
  await deleteRunnerVm(runnerName)
  console.info(chalk.green(`runner ${runnerName} is fully deleted`))
}

async function deleteRunnerFromGitHub (runnerName) {
  const githubStatus = await githubHelper.getRunnerGitHubStateByName(runnerName)
  if (githubStatus !== null) {
    await githubHelper.deleteRunnerGitHub(githubStatus.id)
    console.info(`runner ${runnerName} deleted from GitHub`)
  } else {
    console.warn(chalk.yellow(`runner GitHub status for ${runnerName} is unknown`))
  }
}

async function deleteRunnerVm (runnerName) {
  const runnerVm = await getRunnerHelper.getRunnerVmByName(runnerName)
  const deleteRunnerVmPromise = runnerVm.delete()
  utils.logPromise(deleteRunnerVmPromise, `delete runner ${runnerName} VM`)
  await deleteRunnerVmPromise

  const waitForVmDeletionPromise = pWaitFor(
    () => vmDoesNotExist(runnerVm),
    {
      interval: 5000,
      timeout: 60000
    }
  )
  utils.logPromise(waitForVmDeletionPromise, `waiting runner ${runnerVm.name} vm to be fully deleted`)
  await waitForVmDeletionPromise
}

async function vmDoesNotExist (vm) {
  const [exists] = await vm.exists()
  console.info(`vm ${vm.name} exists = ${exists}`)
  return Promise.resolve(!exists)
}
