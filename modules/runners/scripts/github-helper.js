const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");
const argv = require('minimist')(process.argv.slice(2));

module.exports.getOctokit = async function getOctokit() {
    loadEnv();
    const installAuth = await getInstallAuth(APP_ID, KEY, INSTALLATION_ID, CLIENT_ID, CLIENT_SECRET);
    const octokit = new Octokit({
        auth: installAuth.token,
    });
    return octokit
}

function loadEnv() {
    global.ORG = argv.org;
    global.ENV = argv.env;
    global.KEY = argv['private-key-pem'];
    global.APP_ID = argv['app-id'];
    global.INSTALLATION_ID = argv['app-installation-id'];
    global.CLIENT_ID = argv['client-id'];
    global.CLIENT_SECRET = argv['client-secret'];
}

async function getInstallAuth(appId, privateKey, installationId, clientId, clientSecret) {
    const auth = createAppAuth({
        id: appId,
        privateKey: privateKey,
        installationId: installationId,
        clientId: clientId,
        clientSecret: clientSecret
    });

    const installationAuthentication = await auth({ type: "installation" });
    return installationAuthentication;
}