const githubHelper = require('./github-helper')
const pWaitFor = require('p-wait-for')
const getRunnerHelper = require('./get-runner-helper')
const utils = require('./utils')
const chalk = require('chalk')

module.exports.deleteRunner = deleteRunner
module.exports.deleteRunnerFromGitHub = deleteRunnerFromGitHub
module.exports.deleteRunnerVm = deleteRunnerVm

async function deleteRunner (runnerName) {
  console.info(`start delete runner ${runnerName}...`)
  const deleteFromGitHubSucceed = await deleteRunnerFromGitHub(runnerName)
  if (deleteFromGitHubSucceed) {
    await deleteRunnerVm(runnerName)
    console.info(chalk.green(`runner ${runnerName} is fully deleted`))
    return true
  } else {
    console.info(chalk.yellow(`runner ${runnerName} was not deleted`))
    return false
  }
}

async function deleteRunnerFromGitHub (runnerName) {
  const githubStatus = await githubHelper.getGitHubRunnerByName(runnerName)
  if (githubStatus === null) {
    throw Error(`runner ${runnerName} is unknown from github`)
  }
  if (githubStatus.busy === false) {
    await githubHelper.deleteGitHubRunner(githubStatus.id)
    console.info(`runner ${runnerName} deleted from GitHub`)
    return true
  } else {
    console.warn(chalk.yellow(`runner ${runnerName} is busy, can not delete it from github`))
    return false
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
      timeout: 60000 * 2
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
