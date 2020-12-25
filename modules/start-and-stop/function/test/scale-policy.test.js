const sandbox = require('sinon').createSandbox()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const scalePolicy = require('../src/scale-policy')
const githubHelper = require('../src/github-helper')
const scaleHelper = require('../src/scale-helper')
const getRunnerHelper = require('../src/get-runner-helper')
const scalePolicySettings = require('../src/scale-policy-settings')
const googleSettings = require('../src/google-settings')
const moment = require('moment-timezone')

chai.should()
chai.use(chaiAsPromised)

describe('Scale policy tests', () => {
  afterEach(function () {
    sandbox.verify()
    sandbox.restore()
  })

  describe('When scalling up with threshold already meet', () => {
    it('should not scale up', async () => {
      stubExternalDependencies({ total: 1, nonBusy: 1 }, { upMax: 1, downRate: 1 })
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').never()
      await scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no runner slot available', () => {
    it('should scale up', async () => {
      stubExternalDependencies(
        { total: 0, nonBusy: 0 },
        { upRate: 1, upMax: 1 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(1).once()
      await scalePolicy.scaleUp()
    })
  })

  describe('When scalling up with threshold not meet and no runner slot available', () => {
    it('should not scale up', async () => {
      stubExternalDependencies(
        { total: 1, nonBusy: 0 },
        { upRate: 1, upMax: 1 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleUpRunners').withExactArgs(0).once()
      await scalePolicy.scaleUp()
    })
  })

  describe('When scalling down with threshold already meet', () => {
    it('should not scale down', async () => {
      stubExternalDependencies(
        { total: 0, nonBusy: 0 },
        { upMax: 1, downRate: 1 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      await scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and runners count > downRate', () => {
    it('should scale down accordingly', async () => {
      stubExternalDependencies(
        { total: 4, nonBusy: 4 },
        { upMax: 4, downRate: 2 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(2).once()
      await scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and runners count < downRate', () => {
    it('should scale down accordingly', async () => {
      stubExternalDependencies(
        { total: 4, nonBusy: 1 },
        { upMax: 4, downRate: 2 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(1).once()
      await scalePolicy.scaleDown()
    })
  })

  describe('When scalling down with threshold not meet and no runner available for scale down', () => {
    it('should not scale down', async () => {
      stubExternalDependencies(
        { total: 1, nonBusy: 0 },
        { upMax: 1, downRate: 1 }
      )
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').never()
      await scalePolicy.scaleDown()
    })
  })

  describe('When scalling down within idle runner cron', () => {
    it('should scale down accordingly', async () => {
      stubExternalDependencies(
        { total: 2, nonBusy: 2 },
        { upMax: 2, downRate: 2, idleCount: 1, idleSchedule: '* 8-18 * * 1-5' }
      )
      sandbox.stub(googleSettings, 'timezone').returns('Europe/Paris')
      const idleTime = moment.tz('2020-12-24 14:00', googleSettings.timezone())
      sandbox.useFakeTimers(idleTime.toDate())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(1).once()
      await scalePolicy.scaleDown()
    })
  })

  describe('When scalling down out of idle runner cron', () => {
    it('should scale down accordingly', async () => {
      stubExternalDependencies(
        { total: 2, nonBusy: 2 },
        { upMax: 2, downRate: 2, idleCount: 1, idleSchedule: '* 8-18 * * 1-5' }
      )
      sandbox.stub(googleSettings, 'timezone').returns('Europe/Paris')
      const idleTime = moment.tz('2020-12-24 20:00', googleSettings.timezone())
      sandbox.useFakeTimers(idleTime.toDate())
      const scalHelperMock = sandbox.mock(scaleHelper)
      scalHelperMock.expects('scaleDownRunners').withExactArgs(2).once()
      await scalePolicy.scaleDown()
    })
  })
})

function stubExternalDependencies (runnersParams, scalePolicyCustomSettings) {
  const scalePolicyDefaultSettings = {
    upRate: 1,
    upMax: 1,
    downRate: 1,
    idleCount: 0,
    idleSchedule: ''
  }
  const scalePolicyMergedSettings = { ...scalePolicyDefaultSettings, ...(scalePolicyCustomSettings || {}) }
  sandbox.stub(githubHelper, 'getNonBusyGcpGitHubRunnersCount').resolves(runnersParams.nonBusy)
  const runners = []
  for (let index = 0; index < runnersParams.total; index++) {
    const vm = {
      name: `vm-${index}`
    }
    runners.push(vm)
  }
  sandbox.stub(getRunnerHelper, 'getRunnersVms').resolves(runners)
  sandbox.stub(scalePolicySettings, 'upRate').returns(scalePolicyMergedSettings.upRate)
  sandbox.stub(scalePolicySettings, 'upMax').returns(scalePolicyMergedSettings.upMax)
  sandbox.stub(scalePolicySettings, 'downRate').returns(scalePolicyMergedSettings.downRate)
  sandbox.stub(scalePolicySettings, 'idleCount').returns(scalePolicyMergedSettings.idleCount)
  sandbox.stub(scalePolicySettings, 'idleSchedule').returns(scalePolicyMergedSettings.idleSchedule)
}
