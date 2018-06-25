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

    describe('ValidityError', () => {
        it('Should have name and message changed when created', () => {
            const errorMessage = 'test error message';
            const result = new ValidityError(errorMessage);
            expect(result.message).to.have.string('_Validity_' + errorMessage);
            expect(result.name).to.equal('ValidityError');
        });
    });
});