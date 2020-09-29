const GithubHelper = require('./github-helper.js')
const Util = require('util')

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
    console.log(`Received req with body: ${Util.inspect(req.body, { depth: 0 })}`)
    validateRequest(req)
    const apiResult = await getApiResult(req.body.scope, req.body.function, req.body.params)
    res.status(200).send(apiResult)
  } catch (err) {
    console.log(err)
    res.status(400).send(err)
  }
}

module.exports.dev = async () => {
  const apiResult = await getApiResult('actions', 'listSelfHostedRunnersForOrg', { org: 'fabernovel' })
  console.log(apiResult)
}

async function getApiResult (scopeName, functionName, params) {
  console.log(`calling octokit.${scopeName}.${functionName}(${Util.inspect(params)})`)
  const octokit = await GithubHelper.getOctokit()
  const apiCall = octokit[scopeName][functionName](params)
  const apiResult = await apiCall
  return apiResult.data
}

function validateRequest (request) {
  if (request.method !== 'POST') {
    throw new Error('Only POST method supported')
  }
  if (!request.body.scope) {
    throw new Error('\'scope\' missing from json body')
  }
  if (!request.body.function) {
    throw new Error('\'function\' missing from json body')
  }
  if (!request.body.params) {
    throw new Error('\'params\' missing from json body')
  }
  return request
}
