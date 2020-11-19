import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request } from 'express'
import { getGithubWebhookSecret } from './helper'
import * as crypto from 'crypto'

export const githubHook: HttpFunction = async (req: Request, res: Response) => {
  try {
    await validateRequest(req)
  } catch (error) {
    console.info('event is not valid')
    console.info(error)
    res.status(400).send('Bad request')
    return
  }

  console.log(`body : ${JSON.stringify(req.body)}`)

  if (!isRequestAQueuedCheckRun(req)) {
    console.info('event is not a queued check_run')
    res.status(200).send('Request is not queued check run')
    return
  }

  console.info('event is a queued check_run')

  res.status(200).send('Request processed')
}

export async function validateRequest (req: Request) {
  if (req.method !== 'POST') {
    throw new Error(`Invalid method ${req.method}`)
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

function isRequestAQueuedCheckRun (request: Request): Boolean {
  const body = request.body
  if (body.action !== 'created') {
    console.debug(`event action is not created (${body.action})`)
    return false
  }
  if (!body.check_run) {
    console.debug('event check_run is not present')
    return false
  }
  if (body.check_run.status !== 'queued') {
    console.debug(`status event check_run is not queued (${body.workflow_run.status})`)
    return false
  }
  return true
}

export function generateSignature (secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  return digest.toString('utf8')
}

export async function dev () {
  console.log('hello-world')
}
