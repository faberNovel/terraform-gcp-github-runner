const Compute = require('@google-cloud/compute')
const compute = new Compute()
const zone = compute.zone(process.env.GOOGLE_ZONE)

async function getRunnerVMs (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

async function getAllRunnerVMs () {
  const filter = `labels.env=${process.env.GOOGLE_ENV}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

async function getRunnerVMByName (vmName) {
  return zone.vm(vmName)
}

module.exports.getRunnerVMs = getRunnerVMs
module.exports.getAllRunnerVMs = getAllRunnerVMs
module.exports.getRunnerVMByName = getRunnerVMByName
