const { GoogleAuth } = require('google-auth-library')
const auth = new GoogleAuth()
const createRunnerHelper = require('./create-runner-helper')
const runnerType = require('./runner-type')

module.exports.getGitHubRunners = getGitHubRunners
module.exports.getGcpGitHubRunners = getGcpGitHubRunners
module.exports.deleteGitHubRunner = deleteGitHubRunner
module.exports.filterGitHubRunner = filterGitHubRunner
module.exports.getGitHubRunnerByName = getGitHubRunnerByName
module.exports.checkGitHubRunnerStatus = checkGitHubRunnerStatus
module.exports.getNonBusyGcpGitHubRunnersCount = getNonBusyGcpGitHubRunnersCount
module.exports.gitHubGhostRunnerExists = gitHubGhostRunnerExists
module.exports.getOfflineGitHubRunners = getOfflineGitHubRunners

async function getGitHubRunners () {
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

async function getGcpGitHubRunners () {
  const gitHubRunners = await getGitHubRunners()
  const gcpGitHubRunners = gitHubRunners.filter(gitHubRunner => {
    const isTempRunner = gitHubRunner.name.startsWith(createRunnerHelper.getRunnerNamePrefix(runnerType.temp))
    const isIdleRunner = gitHubRunner.name.startsWith(createRunnerHelper.getRunnerNamePrefix(runnerType.idle))
    return isTempRunner || isIdleRunner
  })
  return gcpGitHubRunners
}

async function gitHubGhostRunnerExists () {
  const gitHubRunners = await getGitHubRunners()
  const gcpGitHubGhostRunners = gitHubRunners.filter(gitHubRunner => {
    return gitHubRunner.name.startsWith(createRunnerHelper.getRunnerNamePrefix(runnerType.ghost))
  })
  return gcpGitHubGhostRunners.length > 0
}

async function deleteGitHubRunner (gitHubRunnerId) {
  const githubApiFunctionUrl = process.env.GITHUB_API_TRIGGER_URL
  const client = await auth.getIdTokenClient(githubApiFunctionUrl)
  await client.request({
    url: githubApiFunctionUrl,
    method: 'POST',
    data: {
      scope: 'actions',
      function: 'deleteSelfHostedRunnerFromOrg',
      params: {
        org: process.env.GITHUB_ORG,
        runner_id: gitHubRunnerId
      }
    }
  })
}

function filterGitHubRunner (githubRunners, runnerName) {
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === runnerName
  })
  if (githubRunner === undefined) {
    return null
  }
  return githubRunner
}

async function getGitHubRunnerByName (runnerName) {
  const githubRunners = await getGitHubRunners()
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === runnerName
  })
  if (githubRunner === undefined) {
    return null
  }
  return githubRunner
}

async function checkGitHubRunnerStatus (runnerName, targetStatus) {
  const runnerGitHubState = await getGitHubRunnerByName(runnerName)
  if (runnerGitHubState === null) {
    console.log(`runner ${runnerName} github status is unknown`)
    return Promise.resolve(false)
  }
  const gitHubStatus = runnerGitHubState.status
  if (gitHubStatus !== targetStatus) {
    console.log(`runner ${runnerName} github status is ${gitHubStatus}`)
    return Promise.resolve(false)
  }
  console.log(`runner ${runnerName} github status is ${targetStatus}`)
  return Promise.resolve(true)
}

async function getNonBusyGcpGitHubRunnersCount () {
  const gcpGitHubRunners = await getGcpGitHubRunners()
  const nonBusyGcpGitHubRunners = gcpGitHubRunners.filter(gitHubRunner => {
    return gitHubRunner.busy === false
  })
  const nonBusyGcpGitHubRunnersCount = nonBusyGcpGitHubRunners.length
  return nonBusyGcpGitHubRunnersCount
}

async function getOfflineGitHubRunners () {
  const gcpGitHubRunners = await getGcpGitHubRunners()
  const offlineGcpGitHubRunners = gcpGitHubRunners.filter(gcpGitHubRunner => {
    return gcpGitHubRunner.status === 'offline'
  })
  return offlineGcpGitHubRunners
}
