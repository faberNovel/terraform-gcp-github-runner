import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

export async function getGithubWebhookSecret (): Promise<String> {
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

function getGithubWebhookSecretFromProcessEnv (): String {
  console.log('Loading github webhook secret from process env')
  return process.env.GITHUB_WEBHOOK_SECRET as string
}

async function getGithubWebhookSecretFromGoogleSecrets (): Promise<String> {
  console.log('Loading github webhook secret from google secrets')
  const client = new SecretManagerServiceClient()
  const version = (await client.accessSecretVersion({
    name: process.env.SECRET_GITHUB_JSON_RESOURCE_NAME
  }))[0]
  const jsonPayload = version!.payload!.data as string
  const githubSecrets = JSON.parse(jsonPayload)
  return githubSecrets.webhook_secret
}
