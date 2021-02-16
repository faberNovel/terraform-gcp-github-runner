module.exports.upRate = () => { return Number(process.env.SCALING_UP_RATE) }
module.exports.upMax = () => { return Number(process.env.SCALING_UP_MAX) }
module.exports.downRate = () => { return Number(process.env.SCALING_DOWN_RATE) }
module.exports.idleCount = () => { return Number(process.env.SCALING_IDLE_COUNT) }
module.exports.idleSchedule = () => { return process.env.SCALING_IDLE_SCHEDULE }
