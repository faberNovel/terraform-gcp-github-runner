const StartInstance = require(`./start_instance.js`);
var chai = require("chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
chai.should();

describe('start instance', function () {
    describe('wrong args', function () {
        it('Should error if wrong args', function() {
            return StartInstance.startInstance(null, null).should.rejected;
        });
    });
});