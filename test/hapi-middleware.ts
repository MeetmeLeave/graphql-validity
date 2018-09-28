import * as sinon from 'sinon';

import { defaultProfilingResultHandler } from '../src/profiling';
import hapiMiddleware from '../lib/hapi-middleware';
import { mockModule } from "./helpers/mocks";
import * as validation from "../lib/validation";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('hapi-middleware', () => {
    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };

    let server;
    let result;
    let applyValidationFake;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        server = {
            ext: () => {}
        };

        applyValidationFake = sinon.fake();
        const mockValidation = mockModule(validation, {
            applyValidation: applyValidationFake
        });
        sandbox = sinon.createSandbox();
        mockValidation(sandbox);

        result = hapiMiddleware(profilingResultHandler);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return wrapper function', () => {
        expect(result).to.be.an('function');
    });

    describe('graphQLValidityHapiMiddleware', () => {
        it('should not throw', () => {
            expect(result).to.not.throw(server);
        });
    });
});