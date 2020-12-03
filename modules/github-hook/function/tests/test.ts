import 'mocha'

import * as chai from 'chai'
import chaiAsPromised from 'chai-as-promised'

import * as sinon from 'sinon'
import * as httpMocks from 'node-mocks-http'

import { generateSignature, validateRequest, isRequestAQueuedCheckRunFromGitHubAction, GITHUB_ACTION_APP_ID } from '../src/github_hook'

chai.use(chaiAsPromised)

describe('GithubHook', () => {
  describe('#validateRequest()', async () => {
    const sandbox = sinon.createSandbox()
    const helper = await import('../src/helper')
    const secret = '1234'
    const body = { key: 'value' }
    const signature = generateSignature(secret, JSON.stringify(body))

    before(() => {
      const stub = sandbox.stub(helper, 'getGithubWebhookSecret')
      stub.returns(Promise.resolve(secret))
    })

    after(() => {
      sandbox.verifyAndRestore()
    })

    it('should throw if method is invalid', () => {
      const request = httpMocks.createRequest({
        method: 'GET'
      })
      return chai.expect(validateRequest(request)).to.eventually.be.rejected
    })

    it('should throw if method is valid but request not signed', () => {
      const request = httpMocks.createRequest({
        method: 'POST'
      })
      return chai.expect(validateRequest(request)).to.eventually.be.rejected
    })

    it('should throw if request is valid and signed with invalid data', () => {
      const request = httpMocks.createRequest({
        method: 'POST',
        headers: {
          'x-hub-signature': signature + 'abc'
        },
        body: body
      })
      return chai.expect(validateRequest(request)).to.eventually.be.rejected
    })

    it('should resolve if request is valid and signed with valid data', () => {
      const request = httpMocks.createRequest({
        method: 'POST',
        headers: {
          'x-hub-signature': signature
        },
        body: body
      })
      return chai.expect(validateRequest(request)).to.eventually.be.fulfilled
    })
  })

  describe('#isRequestAQueuedCheckRunFromGitHubAction()', async () => {
    const sandbox = sinon.createSandbox()

    after(() => {
      sandbox.verifyAndRestore()
    })

    it('should return validate only expected body', () => {
      testBody({}, false)
      testBody({ action: 'created' }, false)
      testBody({ action: 'created', check_run: {} }, false)
      testBody({ action: 'created', check_run: { status: 'queued' } }, false)
      testBody({ action: 'created', check_run: { status: 'queued', app: {} } }, false)
      testBody({ action: 'created', check_run: { status: 'queued', app: { id: '123' } } }, false)
      testBody({ action: 'created', check_run: { status: 'queued', app: { id: GITHUB_ACTION_APP_ID } } }, true)
    })
  })
})

function testBody (body: Object, isAQueuedCheckedRun: Boolean) {
  const request = httpMocks.createRequest({
    body: body
  })
  chai.expect(isRequestAQueuedCheckRunFromGitHubAction(request)).to.be.equals(isAQueuedCheckedRun)
}
