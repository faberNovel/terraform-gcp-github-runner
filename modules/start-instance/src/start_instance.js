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
        const vmsReponse = await compute.zone(payload.zone).getVMs(options);
        const vms = vmsReponse[0];
        console.log(`Found ${vms.length} VMs!`);
        vms.forEach(vm => console.log(`Found VM : ${vm.name}`));
        // Operation complete. Instance successfully started.
        const message = `Successfully started instance(s)`;
        console.log(message);
        return Promise.resolve(message);
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
    if (!payload.zone) {
        throw new Error(`Attribute 'zone' missing from payload`);
    } else if (!payload.label) {
        throw new Error(`Attribute 'label' missing from payload`);
    }
    return payload;
};