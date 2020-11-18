import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request, request } from 'express'
import { getGithubWebhookSecret } from './helper'

export const githubHook: HttpFunction = async (req: Request, res: Response) => {
  console.log(`method : ${req.method}`)
  console.log(`body : ${JSON.stringify(req.body)}`)
  console.log(`headers : ${JSON.stringify(req.headers)}`)

  const isRequestValid = await validateRequest(request)
  if (!isRequestValid) {
    res.status(403).send('Illegal request')
    return
  }

  res.send('Hello, World')
}

export async function validateRequest (req: Request): Promise<Boolean> {
  if (req.method !== 'POST') {
    return Promise.resolve(false)
  }
  return authenticateRequest(req)
}

async function authenticateRequest (req: Request): Promise<Boolean> {
  await getGithubWebhookSecret()
  // TODO
  return Promise.resolve(true)
}

export async function dev () {
  console.log('hello-world')
}
