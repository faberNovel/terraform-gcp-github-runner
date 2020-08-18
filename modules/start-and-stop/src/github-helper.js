const { createAppAuth } = require("@octokit/auth-app");
const { Octokit } = require("@octokit/rest");

module.exports.getOctokit = async function getOctokit() {
    loadEnv();
    const installAuth = await getInstallAuth(APP_ID, KEY, INSTALLATION_ID, CLIENT_ID, CLIENT_SECRET);
    const octokit = new Octokit({
        auth: installAuth.token,
    });
    return octokit
}

function loadEnv() {
    setOrThrow("ORG")
    setOrThrow("KEY")
    setOrThrow("APP_ID")
    setOrThrow("INSTALLATION_ID")
    setOrThrow("CLIENT_ID")
    setOrThrow("CLIENT_SECRET")
}

function setOrThrow(key) {
    if (process.env[key] === undefined) throw new Error(`${key} undefined`)
    global[key] = process.env[key];
}

async function getInstallAuth(appId, privateKey, installationId, clientId, clientSecret) {
    const auth = createAppAuth({
        id: appId,
        privateKey: privateKey,
        installationId: Number(installationId),
        clientId: clientId,
        clientSecret: clientSecret,
    })

    const installationAuthentication = await auth({ type: "installation" });
    return installationAuthentication;
}