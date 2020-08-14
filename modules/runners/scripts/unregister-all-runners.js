const githubHelper = require('./github-helper.js');
const argv = require('minimist')(process.argv.slice(2));

run()

async function run() {
    const baseRunnerName = argv['base-runner-name']
    const octokit = await githubHelper.getOctokit()
    const runnersResponse = await octokit.actions.listSelfHostedRunnersForOrg({ org: ORG })
    const allRunners = runnersResponse.data.runners
    const gcpRunners = allRunners.filter(runner => {
        return runner.name.startsWith(baseRunnerName)
    })
    console.log(gcpRunners)
    await Promise.all(gcpRunners.map(async (gcpRunner) => {
        console.log(`Removing self hosted runner ${gcpRunner.name}`)
        await octokit.actions.deleteSelfHostedRunnerFromOrg({
            org: ORG,
            runner_id: gcpRunner.id
        });
    }));
} 
