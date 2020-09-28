const { createAppAuth } = require('@octokit/auth-app')
const { Octokit } = require('@octokit/rest')
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager')
const client = new SecretManagerServiceClient()

/* global ORG, APP_ID, KEY, INSTALLATION_ID, CLIENT_ID, CLIENT_SECRET */

module.exports.getOctokit = async function getOctokit () {
  await loadEnv()
  const installAuth = await getInstallAuth(APP_ID, KEY, INSTALLATION_ID, CLIENT_ID, CLIENT_SECRET)
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
  console.log(`Loading env done for org : ${ORG}`)
}

async function loadEnvFromGoogleSecrets () {
  console.log('Loading env from google secrets')
  const [version] = await client.accessSecretVersion({
    name: process.env.SECRET_GITHUB_JSON_RESOURCE_NAME
  })
  const jsonPayload = version.payload.data
  const githubSecrets = JSON.parse(jsonPayload)
  global.ORG = githubSecrets.organisation
  global.KEY = Buffer.from(githubSecrets.key_pem_b64, 'base64').toString()
  global.APP_ID = githubSecrets.app_id
  global.INSTALLATION_ID = githubSecrets.app_installation_id
  global.CLIENT_ID = githubSecrets.client_id
  global.CLIENT_SECRET = githubSecrets.client_secret
}

function checkEnvIsSet () {
  throwIfNotSet(ORG)
  throwIfNotSet(KEY)
  throwIfNotSet(APP_ID)
  throwIfNotSet(INSTALLATION_ID)
  throwIfNotSet(CLIENT_ID)
  throwIfNotSet(CLIENT_SECRET)
}

function throwIfNotSet (name) {
  if (name === undefined) throw new Error(`${name} undefined`)
}

function loadEnvFromProcessEnv () {
  console.log('Loading env from process env')
  setGlobal('ORG')
  setGlobal('KEY')
  setGlobal('APP_ID')
  setGlobal('INSTALLATION_ID')
  setGlobal('CLIENT_ID')
  setGlobal('CLIENT_SECRET')
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
