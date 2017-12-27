import { expect } from 'chai';

import {
    FieldValidationDefinitions,
    getResponseValidationResults,
    getResolveValidationResult,
    getValidationResults,
    getValidators,
    applyValidation
} from '../src/validation';
import { DataValidationResult } from '../src/helpers';

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
            }, 'TestObj');

            expect(result).to.have.all.keys('validators', 'globalValidators');
            expect(result['globalValidators'].length).to.be.equal(1);
            expect(result['validators'].length).to.be.equal(2);
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
                ___globalValidationResults: [new Error('test1')],
                ___validationResults: [new Error('test2')]
            };

            const result = applyValidation({ __graphQLValidity: validity }, '{"data": { "result" :"test"}}', () => {});
            expect(result).to.not.be.undefined;
        });

        it('should return errors array attached to the response', () => {
            const validity = {
                ___globalValidationResults: [new Error('test1')],
                ___validationResults: [new Error('test2')]
            };

            const result = applyValidation({ __graphQLValidity: validity }, '{"data": { "result" :"test"}}', () => {});
            expect(result).to.have.string('"errors":[{"message":"test2"},{"message":"test1"}]');
        });
    });

    describe('getValidationResults', () => {
        it('should return object with both global and general validation results ' +
            'if ___validationResults are passed', () => {
            const validity = {
                ___globalValidationResults: [new Error('test1')],
                ___validationResults: [new Error('test2')]
            };

            const result = getValidationResults(validity);
            expect(result).to.have.all.keys('validationResults', 'globalValidationResults');
        });

        it('should return object with both global and general validation results ' +
            'if ___validationResults is not passed', () => {
            const validity = {};
            const result = getValidationResults(validity);
            expect(result).to.have.all.keys('validationResults', 'globalValidationResults');
        });
    });

    describe('getResponseValidationResults', () => {
        it('it should add errors array to data object passed', () => {
            const validationError = new Error('test2');
            const globalError = new Error('test1');
            const validity = {
                ___globalValidationResults: [globalError],
                ___validationResults: [validationError]
            };

            const data = { data: {}, errors: [new Error('test3')] };
            getResponseValidationResults(validity, data);
            expect(data.errors.length).to.equal(3);
        });
    });

    describe('getResolveValidationResult', () => {
        it('should return resolve output, if DataValidationResult wasn\'t used', () => {
            var output = { data: 'test' };
            const validationError = new Error('test2');
            const globalError = new Error('test1');
            const validity = {
                ___globalValidationResults: [globalError],
                ___validationResults: [validationError]
            };

            var result = getResolveValidationResult(output, validity);

            expect(result).to.be.equal(output);
        });

        it('should return resolve output, if validation object wasn\'t passed', () => {
            var output = new DataValidationResult();
            output.data = { data: 'test' };
            var result = getResolveValidationResult(output, null);

            expect(result).to.be.equal(output.data);
        });

        it('should add validation errors from resolve to the validation output', () => {
            var output = new DataValidationResult();
            output.data = { data: 'test' };
            output.errors = [new Error('test3')];
            const validationError = new Error('test2');
            const globalError = new Error('test1');
            const validity = {
                ___globalValidationResults: [globalError],
                ___validationResults: [validationError]
            };

            getResolveValidationResult(output, validity);
            expect(validity.___validationResults.length).to.be.equal(2);
        });
    });
});