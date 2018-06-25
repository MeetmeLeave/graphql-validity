import * as mock from 'mock-require';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { defaultProfilingResultHandler } from '../src/profiling';
import koaMiddleware from '../lib/koa-middleware';

describe('koa-middleware', () => {
    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };
});