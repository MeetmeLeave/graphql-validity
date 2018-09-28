import * as sinon from 'sinon';

import { defaultProfilingResultHandler } from '../src/profiling';
import koaMiddleware from '../lib/koa-middleware';
import { mockModule } from "./helpers/mocks";
import * as validation from "../lib/validation";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

describe('koa-middleware', () => {

    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };

    let req;
    let next;
    let ctx;
    let result;
    let applyValidationFake;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        req = { __graphQLValidity: undefined };
        next = () => {};
        ctx = {
            body: '{}',
            req
        };

        applyValidationFake = sinon.fake();
        const mockValidation = mockModule(validation, {
            applyValidation: applyValidationFake
        });
        sandbox = sinon.createSandbox();
        mockValidation(sandbox);

        result = koaMiddleware(profilingResultHandler);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return wrapper function', () => {
        expect(result).to.be.an('function');
    });

    describe('graphQLValidityKoaMiddleware', () => {
        it('should add validity data to request', () => {
            expect(req.__graphQLValidity).to.not.be.null;
        });

        it('should call validation function', async () => {
            await result(ctx, next);
            expect(applyValidationFake.callCount).to.equal(1);
        });

        it('should not throw exception if output data is not in JSON format', () => {
            ctx = {
                body: '',
                req
            };
            expect(result(ctx, next)).to.eventually.be.fulfilled;
        });
    });
});