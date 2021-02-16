async function logPromise (promise, message) {
  console.log(`waiting : ${message}`)
  await Promise.resolve(promise).then(value => {
    console.log(`done : ${message}`)
  })
}

module.exports.logPromise = logPromise
