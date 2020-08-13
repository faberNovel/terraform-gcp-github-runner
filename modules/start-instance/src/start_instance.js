const Compute = require('@google-cloud/compute');
const compute = new Compute();

module.exports.startInstance = async (data, context) => {
    try {
        console.log("startInstance start...")
        const payload = _validatePayload(
            JSON.parse(Buffer.from(data.data, 'base64').toString())
        );
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
        return Promise.resolve(msg);
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

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
    return payload;
};