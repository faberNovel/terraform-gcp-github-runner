const Compute = require('@google-cloud/compute')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

module.exports.getRunnersVms = getRunnersVms
module.exports.getAllRunnersVms = getAllRunnersVms
module.exports.getRunnerVmByName = getRunnerVmByName

async function getRunnersVms (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

async function getAllRunnersVms () {
  const filter = `labels.env=${process.env.GOOGLE_ENV}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

async function getRunnerVmByName (vmName) {
  return zone.vm(vmName)
}
