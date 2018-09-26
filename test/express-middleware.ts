import { expect } from 'chai';
import * as sinon from 'sinon';

import { defaultProfilingResultHandler } from '../src/profiling';
import expressMiddleware from '../lib/express-middleware';

describe('express-middleware', () => {
    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };

    let resFake;

    describe('graphQLValidityExpressMiddleware', () => {
        it('should return wrapper function', () => {
            const result = expressMiddleware(profilingResultHandler);
            expect(result).to.be.an('function');
        });

        it('should replace original write and send functions with wrappers and add validity data to request', () => {
            const req = {};
            const write = () => {};
            const send = () => {};
            const res = {
                write,
                send
            };
            const next = () => {};

            expressMiddleware(profilingResultHandler)(req, res, next);
            expect(res.write).to.not.equal(write);
            expect(res.send).to.not.equal(send);
        });

        it('should add validity data to request', () => {
            const req = {};
            const write = () => {};
            const send = () => {};
            const res = {
                write,
                send
            };
            const next = () => {};

            expressMiddleware(profilingResultHandler)(req, res, next);
            expect(req.__graphQLValidity).to.not.be.null;
        });
    });

    describe('wrapOriginalResponder', () => {
        afterEach(() => {
            if (resFake && resFake.restore) {
                resFake.restore();
            }
        });

        it('should call original function after execution', () => {
            const req = {};
            const write = () => {};
            resFake = sinon.fake();
            const res = {
                write,
                send: resFake
            };
            const next = () => {};

            expressMiddleware(profilingResultHandler)(req, res, next);
            res.send('{}');
            expect(resFake.callCount).to.equal(1);
        });

        it('should call validation function only once', () => {
            const req = {};
            const write = () => {};
            const send = () => {};
            const res = {
                write,
                send
            };
            const next = () => {};

            const result = expressMiddleware(profilingResultHandler);

            result(req, res, next);
            res.send('{}');
            res.send('{}');
        });

        it('should not throw exception if output data is not in JSON format', () => {
            const req = {};
            const write = () => {};
            const send = () => {};
            const res = {
                write,
                send
            };
            const next = () => {};

            expressMiddleware(profilingResultHandler)(req, res, next);
            expect(res.write).to.not.throw('');
        });
    });
});