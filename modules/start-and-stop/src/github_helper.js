const { GoogleAuth } = require('google-auth-library')
const auth = new GoogleAuth()

module.exports.getRunnerGitHubStates = async function getRunnerGitHubStates () {
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

module.exports.deleteRunnerGitHub = async function deleteRunnerGitHub (gitHubRunnerId) {
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

module.exports.getGitHubRunner = function (githubRunners, vmName) {
  const [githubRunner] = githubRunners.filter(runner => {
    return runner.name === vmName
  })
  if (githubRunner === undefined) {
    return null
  }
  return githubRunner
}
