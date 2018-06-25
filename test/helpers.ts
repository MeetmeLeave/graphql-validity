import { expect } from 'chai';

import {
    onUnhandledError,
    ValidityError
} from '../lib/helpers';

describe('helpers', () => {
    describe('onUnhandledError', () => {
        it('Should mask error', () => {
            const errorMessage = 'test error message';
            const result = onUnhandledError(new Error(errorMessage));
            expect(result.message).to.not.have.string(errorMessage);
            expect(result.message).to.have.string('An internal error occured');
        });
    });
});