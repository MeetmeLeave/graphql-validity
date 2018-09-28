import * as sinon from 'sinon';

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

import {
    wrapResolvers,
    Processed,
    graphQLValidityHapiMiddleware,
    graphQLValidityExpressMiddleware,
    graphQLValidityKoaMiddleware
} from '../lib/schema-wrapper';
import { ValidityConfig } from "../lib/helpers";
import { FieldValidationDefinitions } from "../lib";

describe('schema-wrapper', () => {
    describe('wrapResolvers', () => {
        it('should create proxy for field resolver', () => {
            const resolve = function () {
                return true;
            };
            const field = { resolve };
            wrapResolvers(field);

            expect(field.resolve).to.not.equal(resolve);
        });

        it('should create proxy for field resolvers on a given object type', () => {
            const resolve = function () {
                return true;
            };
            const field = { resolve };

            const type = new GraphQLObjectType([field], 'Test');

            wrapResolvers(type);

            expect(field.resolve).to.not.equal(resolve);
        });

        it('should create proxy for field resolvers on a given schema', () => {
            const resolve = function () {
                return true;
            };
            const field = { resolve };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            expect(field.resolve).to.not.equal(resolve);
        });

        it('should set Processed to true', () => {
            const resolve = function () {
                return true;
            };
            const field = { resolve };
            wrapResolvers(field);

            expect(field[Processed]).to.be.true;
        });

        it('resolve should return result if validity is not set up', async () => {
            const resolve = function () {
                return true;
            };
            const field = { resolve };
            wrapResolvers(field);

            const result = await field.resolve();
            expect(result).to.be.true;
        });

        it('resolve should return result if validity is set up', async () => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test1')}];
            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            const validity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            const result = await field.resolve(
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                });
            expect(result).to.be.true;
        });

        it('resolve should perform validation if validity is set up', async () => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test1')}];
            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            const validity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            await field.resolve(
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                });

            expect(validity.___validationResults.length).to.equal(1);
            expect(validity.___validationResults[0].message).to.equal('test1');
        });

        it('resolve should perform profiling if validity is set up and profiling enabled', async () => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test1')}];
            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema, {
                wrapErrors: false,
                enableProfiling: true,
                unhandledErrorWrapper: (err: Error) => {return err}
            });

            const validity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            await field.resolve(
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                });

            expect(validity.___validationResults.length).to.equal(1);
            expect(validity.___validationResults[0].message).to.equal('test1');
        });

        it('resolve should not throw exception during profiling failure', async () => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test2')}];
            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema, {
                wrapErrors: false,
                enableProfiling: true,
                unhandledErrorWrapper: (err: Error) => {return err}
            });

            const validity = {};

            expect(field.resolve).to.not.throw((
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                }));
        });

        it('resolve should throw during validator exception', async () => {
            FieldValidationDefinitions['$'] = [() => {return new Error('test2')}];
            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema, {
                wrapErrors: false,
                enableProfiling: true,
                unhandledErrorWrapper: (err: Error) => {return err}
            });

            const validity = {};

            expect(field.resolve).to.not.throw((
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                }));
        });

        it('resolve should return result if validity is set up to return promise', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((resolve) => {
                    resolve([new Error('test1')]);
                });
            }];

            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            const validity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            const result = await field.resolve(
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                });
            expect(result).to.be.true;
        });

        it('resolve should perform validation if validity is set up to return promise', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((resolve) => {
                    resolve([new Error('test2')]);
                });
            }];

            const resolve = function (...args: any[]) {
                return true;
            };
            const field = { resolve, name: 'Test' };

            const type = new GraphQLObjectType([field], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            const validity = {
                ___validationResults: [],
                ___globalValidationResultsCaptured: false,
                ___profilingData: []
            };

            await field.resolve(
                {
                    parentType: 'Test',
                    rootValue: {
                        __graphQLValidity: validity
                    }
                });

            expect(validity.___validationResults.length).to.equal(1);
            expect(validity.___validationResults[0].message).to.equal('test2');
        });
    });
});

class GraphQLObjectType {
    constructor(private fields: any[], public name: string) {
    }

    getFields() {
        return this.fields;
    }
}

class GraphQLSchema {
    constructor(private types: any) {

    }

    getTypeMap() {
        return this.types;
    }
}