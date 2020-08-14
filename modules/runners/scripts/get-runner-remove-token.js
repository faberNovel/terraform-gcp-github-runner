const githubHelper = require('./github-helper.js');

run()

async function run() {
    const octokit = await githubHelper.getOctokit()
    const token = await octokit.actions.createRemoveTokenForOrg({
        org: ORG
    })
    console.log(JSON.stringify(token.data))
} 
