import { expect } from 'chai'
import 'mocha'
import { validateRequest, generateSignature } from '../src/github_hook'

import * as httpMocks from 'node-mocks-http'
import * as sinon from 'sinon'

describe('When request is not POST', () => {
  it('Should return false', async () => {
    const request = httpMocks.createRequest({
      method: 'GET'
    })
    const result = await validateRequest(request)
    expect(result).to.equal(false)
  })
})

describe('When request is POST and not signed', () => {
  it('Should return false', async () => {
    const request = httpMocks.createRequest({
      method: 'POST'
    })
    const result = await validateRequest(request)
    expect(result).to.equal(false)
  })
})

describe('When request is POST and signed', async () => {
  const helper = await import('../src/helper')
  const secret = '1234'
  const sandbox = sinon.createSandbox()
  const body = { key: 'value' }
  const signature = generateSignature(secret, JSON.stringify(body))

  beforeEach(() => {
    const stub = sandbox.stub(helper, 'getGithubWebhookSecret')
    stub.returns(Promise.resolve(secret))
  })

  it('Should return true', async () => {
    const request = httpMocks.createRequest({
      method: 'POST',
      headers: {
        'x-hub-signature': signature
      },
      body: body
    })
    const result = await validateRequest(request)
    expect(result).to.equal(true)
  })

  afterEach(() => {
    sandbox.restore()
  })
})
