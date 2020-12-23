module.exports.scaleUpNonBusyRunnersTargetCount = () => { return Number(process.env.SCALING_UP_NON_BUSY_RUNNERS_TARGET_COUNT) }
module.exports.scaleDownNonBusyRunnersChunckSize = () => { return Number(process.env.SCALING_DOWN_NON_BUSY_RUNNERS_CHUNK_SIZE) }
module.exports.runnersMaxCount = () => { return Number(process.env.SCALING_MAX_COUNT) }
module.exports.runnersIdleCount = () => { return Number(process.env.SCALING_IDLE_COUNT) }
module.exports.idleSchedule = () => { return process.env.SCALING_IDLE_SCHEDULE }
