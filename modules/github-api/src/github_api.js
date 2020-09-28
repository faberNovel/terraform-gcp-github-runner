const GithubHelper = require('./github-helper.js')

/* global ORG */

/**
 * HTTP Cloud Function.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
module.exports.githubApi = async (req, res) => {
  try {
    console.log(`Received req ${req}`)
    validateRequest(req)
    const apiResult = await getApiResult(req.body.action)
    res.status(200).send(apiResult)
  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  }
}

module.exports.dev = async () => {
  const apiResult = await getApiResult('listSelfHostedRunnersForOrg')
  console.log(apiResult)
}

async function getApiResult (action) {
  const apiCall = (function (color) {
    switch (color) {
      case 'createRegistrationTokenForOrg':
        return createRegistrationTokenForOrg()
      case 'createRemoveTokenForOrg':
        return createRemoveTokenForOrg()
      case 'listSelfHostedRunnersForOrg':
        return listSelfHostedRunnersForOrg()
      default:
        throw new Error(`action ${action} invalid`)
    }
  })(action)
  const apiResult = await apiCall
  return apiResult.data
}

async function createRegistrationTokenForOrg () {
  console.log('createRegistrationTokenForOrg...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.createRegistrationTokenForOrg({
    org: ORG
  })
  console.log('createRegistrationTokenForOrg done')
  return response
}

async function createRemoveTokenForOrg () {
  console.log('createRemoveTokenForOrg...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.createRemoveTokenForOrg({
    org: ORG
  })
  console.log('createRemoveTokenForOrg done')
  return response
}

async function listSelfHostedRunnersForOrg () {
  console.log('listSelfHostedRunnersForOrg...')
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.listSelfHostedRunnersForOrg({
    org: ORG
  })
  console.log('listSelfHostedRunnersForOrg done')
  return response
}

function validateRequest (request) {
  if (request.method !== 'POST') {
    throw new Error('Only POST supported')
  }
  if (!request.body.action) {
    throw new Error('\'action\' missing from json body')
  }
  return request
}
