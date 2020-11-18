import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request } from 'express'
import { getGithubWebhookSecret } from './helper'

export const githubHook: HttpFunction = (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(403).send('Invalid method')
    return
  }

  console.log(`method : ${req.method}`)
  console.log(`body : ${JSON.stringify(req.body)}`)
  console.log(`headers : ${JSON.stringify(req.headers)}`)
  res.send('Hello, World')
}

async function validateSignature (req: Request): Promise<Boolean> {
  await getGithubWebhookSecret()
  return false
}

export async function dev () {
  const request = {} as Request
  const result = await validateSignature(request)
  console.log(result)
}
