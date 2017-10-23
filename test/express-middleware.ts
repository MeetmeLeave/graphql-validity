import * as mock from 'mock-require';
import { expect } from 'chai';
import * as sinon from 'sinon';

import { defaultProfilingResultHandler } from '../src/profiling';
import expressMiddleware from '../src/express-middleware';

describe('express-middleware', () => {
    let profilingResultHandler: any = {
        handler: defaultProfilingResultHandler
    };
});