import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

export async function getGithubWebhookSecret (): Promise<string> {
  console.log('Loading github webhook secret...')
  try {
    const githubWebhookSecret = getGithubWebhookSecretFromProcessEnv()
    return githubWebhookSecret
  } catch (error) {
    console.log(`Error loading github webhook secret from process : ${error}`)
    const githubWebhookSecret = await getGithubWebhookSecretFromGoogleSecrets()
    return githubWebhookSecret
  }
}

function getGithubWebhookSecretFromProcessEnv (): string {
  console.log('Loading github webhook secret from process env')
  const value = process.env.GITHUB_WEBHOOK_SECRET
  if (!value) {
    throw Error('GITHUB_WEBHOOK_SECRET is undefined')
  }
  return value
}

async function getGithubWebhookSecretFromGoogleSecrets (): Promise<string> {
  console.log('Loading github webhook secret from google secrets')
  const client = new SecretManagerServiceClient()
  const version = (await client.accessSecretVersion({
    name: process.env.SECRET_GITHUB_JSON_RESOURCE_NAME
  }))[0]
  if (!version!.payload) {
    throw new Error('Error loading secret value')
  }
  const jsonPayload = version.payload.data as string
  const githubSecrets = JSON.parse(jsonPayload)
  if (!githubSecrets.webhook_secret) {
    throw new Error('Missing property webhook_secret from secret')
  }
  return githubSecrets.webhook_secret
}
