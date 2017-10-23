import * as mock from 'mock-require';
import { expect } from 'chai';
import * as sinon from 'sinon';

import {
    storeProfilingInfo,
    defaultProfilingResultHandler
} from '../src/profiling';

describe('profiling', () => {
    it('should add profiling data', () => {
        let validity = {
            ___profilingData: []
        };

        storeProfilingInfo(validity, 'path', 'profile');

        expect(validity.___profilingData.length).to.equal(1);
        expect(validity.___profilingData[0].path).to.equal('path');
        expect(validity.___profilingData[0].profile).to.equal('profile');
    });

});