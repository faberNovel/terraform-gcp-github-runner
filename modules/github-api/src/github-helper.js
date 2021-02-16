const { createAppAuth } = require('@octokit/auth-app')
const { Octokit } = require('@octokit/rest')
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
const client = new SecretManagerServiceClient()

module.exports.getOctokit = async function getOctokit () {
  const githubParams = await getGithubParams()
  const installAuth = await getInstallAuth(githubParams)
  const octokit = new Octokit({
    auth: installAuth.token
  })
  return octokit
}

async function getGithubParams () {
  try {
    const githubParams = getGithubParamsFromProcessEnv()
    return githubParams
  } catch (errorProcessEnv) {
    try {
      const githubParams = await getGithubParamsFromGoogleSecrets()
      return githubParams
    } catch (errorSecret) {
      const errorText = `Error loading github params from process (${errorProcessEnv} or google secrets ($)) : ${errorSecret}`
      console.error(errorText)
      return Promise.reject(errorText)
    }
  }
}

function getGithubParamsFromProcessEnv () {
  return new GithubParams(
    process.env.GITHUB_ORG,
    process.env.GITHUB_APP_ID,
    Buffer.from(process.env.GITHUB_KEY_B64, 'base64').toString(),
    process.env.GITHUB_INSTALLATION_ID,
    process.env.GITHUB_CLIENT_ID,
    process.env.GITHUB_CLIENT_SECRET
  )
}

async function getGithubParamsFromGoogleSecrets () {
  const [version] = await client.accessSecretVersion({
    name: process.env.SECRET_GITHUB_JSON_RESOURCE_NAME
  })
  const jsonPayload = version.payload.data
  const githubSecrets = JSON.parse(jsonPayload)
  return new GithubParams(
    githubSecrets.organisation,
    githubSecrets.app_id,
    Buffer.from(githubSecrets.key_pem_b64, 'base64').toString(),
    githubSecrets.app_installation_id,
    githubSecrets.client_id,
    githubSecrets.client_secret
  )
}

async function getInstallAuth (githubParams) {
  const auth = createAppAuth({
    id: githubParams.appId,
    privateKey: githubParams.key,
    installationId: githubParams.installationId,
    clientId: githubParams.clientId,
    clientSecret: githubParams.clientSecret
  })

  const installationAuthentication = await auth({ type: 'installation' })
  return installationAuthentication
}

class GithubParams {
  constructor (org, appId, key, installationId, clientId, clientSecret) {
    if (org === undefined) {
      throw Error('org is undefined')
    }
    this.org = org
    if (appId === undefined) {
      throw Error('appId is undefined')
    }
    this.appId = appId
    if (key === undefined) {
      throw Error('key is undefined')
    }
    this.key = key
    if (installationId === undefined) {
      throw Error('installationId is undefined or not an number')
    }
    this.installationId = Number(installationId)
    if (clientId === undefined) {
      throw Error('clientId is undefined')
    }
    this.clientId = clientId
    if (clientSecret === undefined) {
      throw Error('clientSecret is undefined')
    }
    this.clientSecret = clientSecret
  }
}
