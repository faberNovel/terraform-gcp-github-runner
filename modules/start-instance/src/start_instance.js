const Compute = require('@google-cloud/compute');
const compute = new Compute();

module.exports.startInstance = async (data, context, callback) => {
    try {
        console.log("startInstance start...")
        const payload = _validatePayload(
            JSON.parse(Buffer.from(data.data, 'base64').toString())
        );
        console.log(`payload label = ${payload.label}`);
        const options = { filter: `labels.${payload.label}` };
        const vms = await compute.getVMs(options);
        await Promise.all(
            vms.map(async (instance) => {
                const [operation] = await compute
                    .zone(instance.zone.id)
                    .vm(instance.name)
                    .start();

                // Operation pending
                return operation.promise();
            })
        );
        // Operation complete. Instance successfully started.
        const message = `Successfully started instance(s)`;
        console.log(message);
        callback(null, message);
    } catch (err) {
        console.log(err);
        callback(err);
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