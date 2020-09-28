const GithubHelper = require('./github-helper.js')

/* global ORG */

module.exports.githubApi = async (data, context) => {
  try {
    const payload = validatePayload(
      JSON.parse(Buffer.from(data.data, 'base64').toString())
    )
    const apiResult = await getApiResult(payload.action)
    return Promise.resolve(apiResult)
  } catch (err) {
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  const apiResult = await getApiResult('runners')
  console.log(apiResult)
}

async function getApiResult (action) {
  const apiCall = (function (color) {
    switch (color) {
      case 'registration':
        return getRegistrationToken()
      case 'remove':
        return getRemoveToken()
      case 'runners':
        return getRunners()
      default:
        throw new Error(`action ${action} invalid`)
    }
  })(action)
  return apiCall
}

async function getRegistrationToken () {
  console.log('getRegistrationToken...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.createRegistrationTokenForOrg({
    org: ORG
  })
  console.log('getRegistrationToken done')
  return JSON.stringify(response.data.token)
}

async function getRemoveToken () {
  console.log('getRemoveToken...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.createRemoveTokenForOrg({
    org: ORG
  })
  console.log('getRemoveToken done')
  return JSON.stringify(response.data.token)
}

async function getRunners () {
  console.log('getRunners...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.listSelfHostedRunnersForOrg({
    org: ORG
  })
  console.log('getRunners done')
  return JSON.stringify(response.data.runners)
}

function validatePayload (payload) {
  if (!payload.action) {
    throw new Error('Attribute \'action\' missing from payload')
  }
  return payload
}
