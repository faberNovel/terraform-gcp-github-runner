import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request, request } from 'express'
import { getGithubWebhookSecret } from './helper'
import * as crypto from 'crypto'

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
  const signatureHeader = req.get('x-hub-signature')
  if (!signatureHeader) {
    console.log('no x-hub-signature header')
    return Promise.resolve(false)
  }
  const payload = JSON.stringify(req.body)
  if (!payload) {
    console.log('no body')
    return Promise.resolve(false)
  }
  const secret = await getGithubWebhookSecret()
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  const checksum = Buffer.from(signatureHeader, 'utf8')
  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    console.log('signature does not match')
    return Promise.resolve(false)
  }
  return Promise.resolve(true)
}

export function generateSignature (secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  return digest.toString('utf8')
}

export async function dev () {
  console.log('hello-world')
}
