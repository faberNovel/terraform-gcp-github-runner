const Compute = require('@google-cloud/compute');
const compute = new Compute();

module.exports.startAndStop = async (data, context) => {
    try {
        console.log("startAndStop...")
        const payload = _validatePayload(
            JSON.parse(Buffer.from(data.data, 'base64').toString())
        );
        const vms = await getInstances(payload.filter)
        if (payload.action == "start") {
            await startInstances(vms)
        } else if (payload.action == "stop") {
            await stopInstances(vms)
        }
        return Promise.resolve("startAndStop end");
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

async function getInstances(filter) {
    console.log(`looking for instance(s) with filter ${filter}...`);
    const options = {
        filter: filter
    };
    const [vms] = await compute.getVMs(options);
    console.log(`Found ${vms.length} VMs!`);
    return vms;
}

async function startInstances(vms) {
    await Promise.all(vms.map(async (vm) => {
        console.log(`Starting instance : ${vm.name}`);
        await vm.start();
        Promise.resolve(`instance started`)
    }))
    console.log(`Successfully started instance(s)`);
}

async function stopInstances(vms) {
    await Promise.all(vms.map(async (vm) => {
        console.log(`Stopping instance : ${vm.name}`);
        await vm.stop();
        Promise.resolve(`Instance stopped`)
    }))
    console.log(`Successfully stopped instance(s)`);
}

/**
 * Validates that a request payload contains the expected fields.
 *
 * @param {!object} payload the request payload to validate.
 * @return {!object} the payload object.
 */
const _validatePayload = (payload) => {
    if (!payload.filter) {
        throw new Error(`Attribute 'filter' missing from payload`);
    }
    if (!payload.action) {
        throw new Error(`Attribute 'action' missing from payload`);
    }
    return payload;
};