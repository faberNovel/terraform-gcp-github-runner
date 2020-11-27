const { GoogleAuth } = require('google-auth-library')
const auth = new GoogleAuth()
const createRunnerHelper = require('./create-runner-helper')

module.exports.getGitHubRunners = getGitHubRunners
module.exports.getGcpGitHubRunners = getGcpGitHubRunners
module.exports.deleteGitHubRunner = deleteGitHubRunner
module.exports.filterGitHubRunner = filterGitHubRunner
module.exports.getGitHubRunnerByName = getGitHubRunnerByName
module.exports.isGitHubRunnerOnline = isGitHubRunnerOnline

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
    return gitHubRunner.name.startsWith(createRunnerHelper.getRunnerNamePrefix())
  })
  return gcpGitHubRunners
}

async function deleteGitHubRunner (gitHubRunnerId) {
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

async function isGitHubRunnerOnline (runnerName) {
  const runnerGitHubState = await getGitHubRunnerByName(runnerName)
  if (runnerGitHubState === null) {
    console.log(`runner ${runnerName} github status is unknown`)
    return Promise.resolve(false)
  }
  const gitHubStatus = runnerGitHubState.status
  if (gitHubStatus !== 'online') {
    console.log(`runner ${runnerName} github status is ${gitHubStatus}`)
    return Promise.resolve(false)
  }
  console.log(`runner ${runnerName} github status is online`)
  return Promise.resolve(true)
}
