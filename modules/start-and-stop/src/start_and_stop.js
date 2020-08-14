const Compute = require('@google-cloud/compute');
const compute = new Compute();

module.exports.startAndStop = async (data, context) => {
    try {
        console.log("startAndStop...")
        const payload = _validatePayload(
            JSON.parse(Buffer.from(data.data, 'base64').toString())
        );
        await startInstances(payload.label)
        return Promise.resolve(msg);
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

async function startInstances(label) {
    console.log("startInstance start...");
    console.log(`payload label = ${payload.label}`);
    const options = {
        filter: `labels.${payload.label}`
    };
    const [vms] = await compute.getVMs(options);
    console.log(`Found ${vms.length} VMs!`);
    await Promise.all(vms.map(async (vm) => {
        console.log(`Found VM : ${vm.name}`);
        await vm.start();
        Promise.resolve(`VM started`)
    }))
    // Operation complete. Instance successfully started.
    const msg = `Successfully started instance(s)`
    console.log(msg);
}

/**
 * Validates that a request payload contains the expected fields.
 *
 * @param {!object} payload the request payload to validate.
 * @return {!object} the payload object.
 */
const _validatePayload = (payload) => {
    if (!payload.label) {
        throw new Error(`Attribute 'label' missing from payload`);
    }
    if (!payload.action) {
        throw new Error(`Attribute 'action' missing from payload`);
    }
    return payload;
};