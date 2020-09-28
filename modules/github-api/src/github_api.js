module.exports.githubApi = async (data, context) => {
  try {
    console.log('Hello from github api interface')
    return Promise.resolve('dummy result')
  } catch (err) {
    console.log(err)
    return Promise.reject(err)
  }
}

module.exports.dev = async () => {

}
