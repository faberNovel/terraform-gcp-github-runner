import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

export async function getGithubWebhookSecret (): Promise<string> {
  try {
    const githubWebhookSecret = getGithubWebhookSecretFromProcessEnv()
    return githubWebhookSecret
  } catch (errorProcessEnv) {
    try {
      const githubWebhookSecret = await getGithubWebhookSecretFromGoogleSecrets()
      return githubWebhookSecret
    } catch (errorSecret) {
      const errorText = `Can not load secret from process (${errorProcessEnv}) or google secrets (${errorSecret})`
      console.error(errorText)
      return Promise.reject(errorText)
    }
  }
}

function getGithubWebhookSecretFromProcessEnv (): string {
  const value = process.env.GITHUB_WEBHOOK_SECRET
  if (!value) {
    throw Error('Can not load GITHUB_WEBHOOK_SECRET from process env')
  }
  return value
}

async function getGithubWebhookSecretFromGoogleSecrets (): Promise<string> {
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
