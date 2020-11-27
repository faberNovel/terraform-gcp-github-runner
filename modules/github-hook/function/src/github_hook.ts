import type { HttpFunction } from '@google-cloud/functions-framework/build/src/functions'
import { Response, Request } from 'express'
import { getGithubWebhookSecret } from './helper'
import * as crypto from 'crypto'
import { PubSub } from '@google-cloud/pubsub'

const GITHUB_ACTION_APP_ID = 15368

export const githubHook: HttpFunction = async (req: Request, res: Response) => {
  try {
    await validateRequest(req)
  } catch (error) {
    console.info('event is not valid')
    console.info(error)
    res.sendStatus(400)
    return
  }

  if (!isRequestAQueuedCheckRunFromGitHubAction(req)) {
    console.info('event is not a queued check_run')
    res.sendStatus(403)
    return
  }

  const checkRunPayload = createCheckRunPayload(req)
  console.info(`event is a queued check_run : ${JSON.stringify(checkRunPayload)}`)

  if (checkRunPayload.repository.toLowerCase().includes('ios')) {
    console.info('looks like a iOS workflow, ingoring...')
    res.sendStatus(202)
    return
  }

  res.sendStatus(202)
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

function isRequestAQueuedCheckRunFromGitHubAction (request: Request): Boolean {
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
  if (!body.check_run.app) {
    console.debug('event app is not present')
    return false
  }
  if (body.check_run.app.id !== GITHUB_ACTION_APP_ID) {
    console.debug('event was not trigger by github action')
    return false
  }
  return true
}

function createCheckRunPayload (request: Request): CheckRunPayload {
  const checkRun = request.body.check_run
  const repository = request.body.repository
  return new CheckRunPayload(
    checkRun.id,
    checkRun.started_at,
    repository.name,
    repository.owner.login
  )
}

export function generateSignature (secret: string, payload: string): string {
  const hmac = crypto.createHmac('sha1', secret)
  const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8')
  return digest.toString('utf8')
}

export async function dev () {
  console.log('hello-world')
  const topicName = process.env.START_AND_STOP_TOPIC_NAME!
  const data = JSON.stringify({ foo: 'bar' })
  const pubsub = new PubSub()
  const dataBuffer = Buffer.from(data)
  const messageId = await pubsub.topic(topicName).publish(dataBuffer)
  console.log(messageId)
}

class CheckRunPayload {
  constructor (
    readonly checkRunId: bigint,
    readonly startedAt: string,
    readonly repository: string,
    readonly owner: String
  ) {}
}
