const sinon = require('sinon')
const chai = require('chai')
const rewire = require('rewire')
const scaleHelper = rewire('./scale_helper.js')
const createVMHelper = require('./create_vm_helper.js')
const gitHubHelper = require('./github_helper')
const getVMHelper = require('./get_vm_helper.js')

chai.should()

describe('scale helper tests', () => {
  describe('When calling scale up runners', () => {
    it('Should scale up runners', async () => {
      const scaleUpRunners = scaleHelper.__get__('scaleUpRunners')
      const idle = false
      const count = 3
      const stub = sinon.stub(createVMHelper, 'createVm').returns(Promise.resolve())

      await scaleUpRunners(idle, count)

      stub.getCalls().map(it => {
        const idleParam = it.args[0]
        idleParam.should.equals(idle)
      })
      stub.getCalls().length.should.equals(count)

      stub.restore()
    })
  })

  describe('When calling scale down runners', () => {
    it('Should scale down runners', async () => {
      const scaleDownRunners = scaleHelper.__get__('scaleDownRunners')
      const idle = false
      const count = 2
      const force = true
      const vm1 = {
        name: 'vm1',
        delete: async function () {}
      }
      const vm2 = {
        name: 'vm1',
        delete: async function () {}
      }

      const mockVM1 = sinon.mock(vm1).expects('delete').once()
      const mockVM2 = sinon.mock(vm2).expects('delete').once()

      const vms = [vm1, vm2]
      const stubGetRunnerVMs = sinon
        .stub(getVMHelper, 'getRunnerVMs')
        .returns(Promise.resolve(vms))
      const stubGetRunnerGitHubStates = sinon
        .stub(gitHubHelper, 'getRunnerGitHubStates')
        .returns(Promise.resolve())
      const stubGetRunnerGitHubStateByName = sinon
        .stub(gitHubHelper, 'getRunnerGitHubStateByName')
        .returns()

      await scaleDownRunners(idle, count, force)

      mockVM1.verify()
      mockVM2.verify()

      stubGetRunnerVMs.restore()
      stubGetRunnerGitHubStates.restore()
      stubGetRunnerGitHubStateByName.restore()
    })
  })
})
