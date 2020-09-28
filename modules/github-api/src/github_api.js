const GithubHelper = require('./github-helper.js')

/* global ORG */

module.exports.githubApi = async (data, context) => {
  try {
    console.log('Hello from github api interface')
    const token = getRegistrationToken()
    return Promise.resolve(token)
  } catch (err) {
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {
  const token = await getRegistrationToken()
  console.log(token)
}

async function getRegistrationToken () {
  const octokit = await GithubHelper.getOctokit()
  const response = await octokit.actions.createRegistrationTokenForOrg({
    org: ORG
  })
  return JSON.stringify(response.data.token)
}
