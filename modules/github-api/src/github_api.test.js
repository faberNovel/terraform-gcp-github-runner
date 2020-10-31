const sinon = require('sinon')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
chai.should()

afterEach(function () {
  sinon.restore()
})
