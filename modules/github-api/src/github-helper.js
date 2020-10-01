const { createAppAuth } = require('@octokit/auth-app')
const { Octokit } = require('@octokit/rest')
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
const client = new SecretManagerServiceClient()

/* global GITHUB_ORG, GITHUB_APP_ID, GITHUB_KEY, GITHUB_INSTALLATION_ID, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET */

module.exports.getOctokit = async function getOctokit () {
  await loadEnv()
  const installAuth = await getInstallAuth(GITHUB_APP_ID, GITHUB_KEY, GITHUB_INSTALLATION_ID, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
  const octokit = new Octokit({
    auth: installAuth.token
  })
  return octokit
}

async function loadEnv () {
  console.log('Loading env...')
  try {
    loadEnvFromProcessEnv()
    checkEnvIsSet()
  } catch (error) {
    await loadEnvFromGoogleSecrets()
    checkEnvIsSet()
  }
  console.log(`Loading env done for org : ${GITHUB_ORG}`)
}

async function loadEnvFromGoogleSecrets () {
  console.log('Loading env from google secrets')
  const [version] = await client.accessSecretVersion({
    name: process.env.SECRET_GITHUB_JSON_RESOURCE_NAME
  })
  const jsonPayload = version.payload.data
  const githubSecrets = JSON.parse(jsonPayload)
  global.GITHUB_ORG = githubSecrets.organisation
  global.GITHUB_KEY = Buffer.from(githubSecrets.key_pem_b64, 'base64').toString()
  global.GITHUB_APP_ID = githubSecrets.app_id
  global.GITHUB_INSTALLATION_ID = githubSecrets.app_installation_id
  global.GITHUB_CLIENT_ID = githubSecrets.client_id
  global.GITHUB_CLIENT_SECRET = githubSecrets.client_secret
}

function checkEnvIsSet () {
  throwIfNotSet(GITHUB_ORG)
  throwIfNotSet(GITHUB_KEY)
  throwIfNotSet(GITHUB_APP_ID)
  throwIfNotSet(GITHUB_INSTALLATION_ID)
  throwIfNotSet(GITHUB_CLIENT_ID)
  throwIfNotSet(GITHUB_CLIENT_SECRET)
}

function throwIfNotSet (name) {
  if (name === undefined) throw new Error(`${name} undefined`)
}

function loadEnvFromProcessEnv () {
  console.log('Loading env from process env')
  setGlobal('GITHUB_ORG')
  setGlobal('GITHUB_KEY')
  setGlobal('GITHUB_APP_ID')
  setGlobal('GITHUB_INSTALLATION_ID')
  setGlobal('GITHUB_CLIENT_ID')
  setGlobal('GITHUB_CLIENT_SECRET')
}

function setGlobal (key) {
  global[key] = process.env[key]
}

async function getInstallAuth (appId, privateKey, installationId, clientId, clientSecret) {
  const auth = createAppAuth({
    id: appId,
    privateKey: privateKey,
    installationId: Number(installationId),
    clientId: clientId,
    clientSecret: clientSecret
  })

  const installationAuthentication = await auth({ type: 'installation' })
  return installationAuthentication
}
