const Compute = require('@google-cloud/compute');
const compute = new Compute();

module.exports.startAndStop = async (data, context) => {
    try {
        console.log("startAndStop...")
        const payload = _validatePayload(
            JSON.parse(Buffer.from(data.data, 'base64').toString())
        );
        if (payload.action == "start") {
            await startInstances(payload.filter)
        }
        return Promise.resolve("startAndStop end");
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

async function startInstances(filter) {
    console.log("startInstance start...");
    console.log(`filter = ${filter}`);
    const options = {
        filter: filter
    };
    const [vms] = await compute.getVMs(options);
    console.log(`Found ${vms.length} VMs!`);
    await Promise.all(vms.map(async (vm) => {
        console.log(`Found VM : ${vm.name}`);
        await vm.start();
        Promise.resolve(`VM started`)
    }))
    console.log(`Successfully started instance(s)`);
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