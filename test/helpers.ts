import { expect } from 'chai';

import {
    onUnhandledError,
    ValidityError
} from '../src/helpers';

describe('helpers', () => {
    describe('onUnhandledError', () => {
        it('Should mask error if it was not instantiated from ValidityError', () => {
            const errorMessage = 'test error message';
            const result = onUnhandledError(new Error(errorMessage));
            expect(result.message).to.not.have.string(errorMessage);
            expect(result.message).to.have.string('An internal error occured');
        });

        it('Should not mask error if it was not instantiated from ValidityError', () => {
            const errorMessage = 'test error message';
            const error = new ValidityError(errorMessage)
            const result = onUnhandledError(error);

            expect(result.message).to.have.string(errorMessage);
            expect(result.message).to.not.have.string('An internal error occured');
        });
    });
});