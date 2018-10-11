import * as sinon from 'sinon';
import { expect } from 'chai';
import * as validation from '../src/validation';

import { defaultProfilingResultHandler } from '../src/profiling';
import expressMiddleware from '../src/express-middleware';
import { mockModule } from "./helpers/mocks";

describe('express-middleware', () => {
    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };

    let req: any;
    let write: any;
    let send: any;
    let res: any;
    let next: any;
    let result: any;
    let resFake: any;
    let applyValidationFake: any;
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        resFake = sinon.fake();

        req = { __graphQLValidity: undefined };
        write = () => {};
        send = () => {};
        res = {
            write,
            send: resFake
        };
        next = () => {};

        applyValidationFake = sinon.fake();
        const mockValidation = mockModule(validation, {
            applyValidation: applyValidationFake
        });
        sandbox = sinon.createSandbox();
        mockValidation(sandbox);

        result = expressMiddleware(profilingResultHandler);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should return wrapper function', () => {
        expect(result).to.be.an('function');
    });

    describe('graphQLValidityExpressMiddleware', () => {
        it('should replace original write and send functions with wrappers and add validity data to request', () => {
            result(req, res, next);
            expect(res.write).to.not.equal(write);
            expect(res.send).to.not.equal(send);
        });

        it('should add validity data to request', () => {
            expect(req.__graphQLValidity).to.not.be.null;
        });
    });

    describe('wrapOriginalResponder', () => {
        it('should call original function after execution', () => {
            res.send('{}');
            expect(resFake.callCount).to.equal(1);
        });

        it('should call validation function only once', () => {
            result(req, res, next);

            res.send('{}');
            res.send('{}');
            expect(applyValidationFake.callCount).to.equal(1);
        });

        it('should not throw exception if output data is not in JSON format', () => {
            result(req, res, next);
            expect(res.write).to.not.throw('');
        });
    });
});