const startAndStop = require(`./start_and_stop.js`);
const sinon = require('sinon');
const chai = require("chai");
const chaiAsPromised = require('chai-as-promised');
const Compute = require('@google-cloud/compute');

chai.use(chaiAsPromised);
chai.should();

describe('start instance', function () {
    describe('wrong args', function () {
        it('Should error if wrong args', function() {
            return startAndStop.startAndStop(null, null).should.rejected
        })
    })
    describe('happy path 0 VMs', function() {
        it('Should be fulfilled', function() {
            const env = "test"
            const json = {
                "action": "start",
                "filter": `labels.env=${env} AND labels.idle=false}`
            }
            const jsonBase64 = Buffer.from(JSON.stringify(json)).toString('base64')
            const payload = {
                "data": jsonBase64
            }
            sinon.stub(Compute.prototype, `getVMs`).callsFake(() => [[]])
            return startAndStop.startAndStop(payload, null).should.be.fulfilled
        })
    })
})