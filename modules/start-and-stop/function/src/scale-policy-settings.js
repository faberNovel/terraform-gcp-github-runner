module.exports.scaleUpNonBusyRunnersTargetCount = () => { return process.env.SCALING_UP_NON_BUSY_RUNNERS_TARGET_COUNT }
module.exports.scaleDownNonBusyRunnersChunckSize = () => { return process.env.SCALING_DOWN_NON_BUSY_RUNNERS_CHUNK_SIZE }
module.exports.idleCount = () => { return process.env.SCALING_IDLE_COUNT }
module.exports.idleSchedule = () => { return process.env.SCALING_IDLE_SCHEDULE }
