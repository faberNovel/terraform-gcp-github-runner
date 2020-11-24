const { GoogleAuth } = require('google-auth-library')
const auth = new GoogleAuth()

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

async function deleteRunnerGitHub (gitHubRunnerId) {
  const githubApiFunctionUrl = process.env.GITHUB_API_TRIGGER_URL
  const client = await auth.getIdTokenClient(githubApiFunctionUrl)
  const res = await client.request({
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
  return res.data.runners
}

function parseGitHubRunnerStatus (githubRunners, vmName) {
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === vmName
  })
  if (githubRunner === undefined) {
    return null
  }
  return githubRunner
}

async function getRunnerGitHubStateByName (name) {
  const githubRunners = await getRunnerGitHubStates()
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === name
  })
  if (githubRunner === undefined) {
    return null
  }
  return githubRunner
}

async function isRunnerGitHubStateOnline (name) {
  const runnerGitHubState = await getRunnerGitHubStateByName(name)
  if (runnerGitHubState === null) {
    console.log(`runner ${name} github status is unknown`)
    return Promise.resolve(false)
  }
  const gitHubStatus = runnerGitHubState.status
  if (gitHubStatus !== 'online') {
    console.log(`runner ${name} github status is ${gitHubStatus}`)
    return Promise.resolve(false)
  }
  console.log(`runner ${name} github status is online`)
  return Promise.resolve(true)
}

module.exports.getRunnerGitHubStates = getRunnerGitHubStates
module.exports.deleteRunnerGitHub = deleteRunnerGitHub
module.exports.parseGitHubRunnerStatus = parseGitHubRunnerStatus
module.exports.getRunnerGitHubStateByName = getRunnerGitHubStateByName
module.exports.isRunnerGitHubStateOnline = isRunnerGitHubStateOnline
