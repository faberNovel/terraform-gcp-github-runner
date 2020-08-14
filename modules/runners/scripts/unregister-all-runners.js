const githubHelper = require('./github-helper.js');

run()

async function run() {
    const octokit = await githubHelper.getOctokit()
    const runnersResponse = await octokit.actions.listSelfHostedRunnersForOrg({ org: ORG })
    const allRunners = runnersResponse.data.runners
    const gcpRunners = allRunners.filter(runner => {
        const gcpLabels = runner.labels.filter(label => {
            return label.name == `gcp-${ENV}`
        })
        return gcpLabels.length > 0
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
