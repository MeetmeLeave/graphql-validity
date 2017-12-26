import * as mock from 'mock-require';
import { expect } from 'chai';
import * as sinon from 'sinon';

import {
    FieldValidationDefinitions,
    getResponseValidationResults,
    getResolveValidationResult,
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
                ___globalValidationResults: ['test1'],
                ___validationResults: ['test2']
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
});