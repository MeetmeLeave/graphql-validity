import { expect } from 'chai';

import {
    FieldValidationDefinitions,
    getResponseValidationResults,
    getValidationResults,
    getValidators,
    applyValidation
} from '../src/validation';

describe('validation', () => {
    describe('getValidators', () => {
        before(() => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test1')}];
            FieldValidationDefinitions['*'] = [() => {return new Error('test2')}];
            FieldValidationDefinitions['TestObj'] = [() => {return new Error('test3')}];
            FieldValidationDefinitions['TestObj:TestField'] = [() => {return new Error('test4')}];
        });

        it('Should return object with arrays for both ' +
            'global and normal validator functions', () => {
            let result = getValidators({
                type: 'TestField',
                name: 'TestField'
            }, 'TestObj', { ___globalValidationResultsCaptured: false });

            expect(result.length).to.be.equal(3);
        });
    });

    describe('applyValidation', () => {
        it('shouldn\'t return value if result missing data object', () => {
            const result = applyValidation({}, '{}', () => {});
            expect(result).to.be.undefined;
        });

        it('should throw JSON parsing error, if data has incorrect format', () => {
            expect(applyValidation).to.throw('Unexpected token u in JSON at position 0');
        });

        it('should return value if result has data object', () => {
            const validity = {
                ___globalValidationResultsCaptured: false,
                ___validationResults: [new Error('test2'), new Error('test1')]
            };

            const result = applyValidation({ __graphQLValidity: validity }, '{"data": { "result" :"test"}}', () => {});
            expect(result).to.not.be.undefined;
        });

        it('should return errors array attached to the response', () => {
            const validity = {
                ___globalValidationResultsCaptured: false,
                ___validationResults: [new Error('test2'), new Error('test1')]
            };

            const result = applyValidation({ __graphQLValidity: validity }, '{"data": { "result" :"test"}}', () => {});
            expect(result).to.have.string('"errors":[{"message":"test2"},{"message":"test1"}]');
        });
    });

    describe('getValidationResults', () => {
        it('should return object with both global and general validation results ' +
            'if ___validationResults are passed', () => {
            const validity = {
                ___globalValidationResultsCaptured: false,
                ___validationResults: [new Error('test2'), new Error('test1')]
            };

            const result = getValidationResults(validity);
            expect(result).to.be.an('array');
            expect(result.length).to.equal(2);
        });

        it('should return empty array of validation results ' +
            'if ___validationResults is not passed', () => {
            const validity = {};
            const result = getValidationResults(validity);
            expect(result).to.be.an('array').to.be.empty;
        });
    });

    describe('getResponseValidationResults', () => {
        it('it should add errors array to data object passed', () => {
            const validationError = new Error('test2');
            const globalError = new Error('test1');
            const validity = {
                ___globalValidationResultsCaptured: false,
                ___validationResults: [validationError, globalError]
            };

            const data = { data: {}, errors: [new Error('test3')] };
            getResponseValidationResults(validity, data);
            expect(data.errors.length).to.equal(3);
        });
    });
});