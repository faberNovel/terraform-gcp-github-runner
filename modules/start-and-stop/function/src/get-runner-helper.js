const Compute = require('@google-cloud/compute')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

module.exports.getRunnersVms = getRunnersVms
module.exports.getRunnerVmByName = getRunnerVmByName

async function getRunnersVms (runnerType) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.type=${runnerType}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

async function getRunnerVmByName (vmName) {
  return zone.vm(vmName)
}
