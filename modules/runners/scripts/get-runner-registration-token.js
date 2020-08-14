const githubHelper = require('./github-helper.js');

run()

async function run() {
    const octokit = await githubHelper.getOctokit()
    const token = await octokit.actions.createRegistrationTokenForOrg({
        org: ORG
    })
    console.log(JSON.stringify(token.data))
} 
