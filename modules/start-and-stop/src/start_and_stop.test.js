const StartAndStop = require(`./start_and_stop.js`);
var chai = require("chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

describe('start instance', function () {
    describe('wrong args', function () {
        it('Should error if wrong args', function() {
            return StartAndStop.startAndStop(null, null).should.rejected;
        });
    });
});