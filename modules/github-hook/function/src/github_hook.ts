import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request, request } from 'express'
import { getGithubWebhookSecret } from './helper'
import * as crypto from 'crypto'

export const githubHook: HttpFunction = async (req: Request, res: Response) => {
  console.log(`method : ${req.method}`)
  console.log(`body : ${JSON.stringify(req.body)}`)
  console.log(`headers : ${JSON.stringify(req.headers)}`)

  try {
    await validateRequest(request)
  } catch (error) {
    console.error(error)
    res.status(400).send('Bad request')
    return
  }

  res.status(200).send('Request processed')
}

export async function validateRequest (req: Request) {
  if (req.method !== 'POST') {
    throw new Error('Invalid method')
  }
  await authenticateRequest(req)
}

async function authenticateRequest (req: Request) {
  const signatureHeader = req.get('x-hub-signature')
  if (!signatureHeader) {
    throw new Error('no x-hub-signature header')
  }
  const payload = JSON.stringify(req.body)
  if (!payload) {
    throw new Error('no body')
  }
  const secret = await getGithubWebhookSecret()
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  const checksum = Buffer.from(signatureHeader, 'utf8')
  if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
    throw new Error('signature does not match')
  }
}

export function generateSignature (secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  return digest.toString('utf8')
}

export async function dev () {
  console.log('hello-world')
}
