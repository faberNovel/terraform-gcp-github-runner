import { expect } from 'chai'
import 'mocha'
import { validateRequest } from '../src/github_hook'
import httpMocks from 'node-mocks-http'

describe('When request is not POST', () => {
  it('Should return false', async () => {
    const request = httpMocks.createRequest({
      method: 'GET'
    })
    const result = await validateRequest(request)
    expect(result).to.equal(false)
  })
})
