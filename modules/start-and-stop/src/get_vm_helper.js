const Compute = require('@google-cloud/compute')
const compute = new Compute()

module.exports.getRunnerVMs = async function getRunnerVMs (idle) {
  const filter = `labels.env=${process.env.GOOGLE_ENV} AND labels.idle=${idle}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}

module.exports.getAllRunnerVMs = async function getAllRunnerVMs () {
  const filter = `labels.env=${process.env.GOOGLE_ENV}`
  const options = {
    filter: filter
  }
  const [vms] = await compute.getVMs(options)
  return vms
}
