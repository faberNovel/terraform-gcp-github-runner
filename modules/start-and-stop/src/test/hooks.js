const sinon = require('sinon')

exports.mochaHooks = {
  beforeAll () {
    console.log('Starting tests, console will be disable')
    sinon.stub(console, 'log') // disable console.log
    sinon.stub(console, 'info') // disable console.info
    sinon.stub(console, 'warn') // disable console.warn
    sinon.stub(console, 'error') // disable console.error
  },
  afterAll () {
    console.log.restore()
    console.log('Test run ended')
  }
}
