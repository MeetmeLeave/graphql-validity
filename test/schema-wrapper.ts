import * as sinon from "sinon";

var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
var expect = chai.expect;

import {
    wrapResolvers,
    Processed
} from '../lib/schema-wrapper';
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

            expect(validity.___profilingData.length).to.equal(1);
        });

        it('resolve should perform profiling if validity is set up and profiling enabled and validator returns promise', async () => {
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
            wrapResolvers(schema, {
                wrapErrors: false,
                enableProfiling: true,
                profilingResultHandler: () => {}
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

            expect(validity.___profilingData.length).to.equal(1);
        });

        it('resolve should perform profiling if validity is set up and profiling enabled and resolver returns promise', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return [];
            }];
            const resolve = function (...args: any[]) {
                return new Promise((resolve) => {
                    resolve([new Error('test1')]);
                });
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
                profilingResultHandler: () => {}
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

            expect(validity.___profilingData.length).to.equal(1);
        });

        it('resolve should perform profiling if validity is set up and profiling enabled and both resolver and validation returns promise', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((
                    resolve,
                    reject
                ) => resolve([]))
            }];
            const resolve = function (...args: any[]) {
                return new Promise((resolve) => {
                    resolve([new Error('test1')]);
                });
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

            expect(validity.___profilingData.length).to.equal(1);
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

        it('resolve should not throw during validator exception being returned', async () => {
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

        it('resolve should throw during validator promise rejection', async () => {
                FieldValidationDefinitions['$'] = [() => {
                    return new Promise((resolve, reject) => reject('test2'));
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
                wrapResolvers(schema, {
                    wrapErrors: false,
                    enableProfiling: true,
                    unhandledErrorWrapper: (err: Error) => {return err}
                });

                const validity = {};

                expect(field.resolve(
                    {
                        parentType: 'Test',
                        rootValue: {
                            __graphQLValidity: validity
                        }
                    })).to.eventually.be.rejected;
            }
        );

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

        it('shouldn\'t replace resolver for type not implementing getFields', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((resolve) => {
                    resolve([new Error('test2')]);
                });
            }];

            const resolve = function (...args: any[]) {
                return true;
            };

            const field = { resolve, name: 'Test' };
            const field2 = {
                resolve: function (...args: any[]) {
                    return true;
                }, name: 'Test2'
            };

            const type = new GraphQLObjectTypeWithoutFields([field, field2], 'Test');
            const typesMap = {
                'Test': type
            };
            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            expect(type.fields[0].resolve).to.equal(resolve);
        });

        it('shouldn\'t replace resolvers for functions that aren\'t related to types', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((resolve) => {
                    resolve([new Error('test2')]);
                });
            }];

            const resolve = function (...args: any[]) {
                return true;
            };

            const resolve2 = function (...args: any[]) {
                return true;
            };

            const field = { resolve, name: 'Test' };
            const field2 = {
                resolve: resolve2, name: 'Test2'
            };

            const type = new GraphQLObjectTypeFieldAsObject(
                new FieldsType2(field, field2), 'Test'
            );

            const typesMap = {
                'Test': type
            };

            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            expect(field.resolve).to.not.equal(resolve);
            expect(field2.resolve).to.not.equal(resolve2);
        });

        it('shouldn\'t replace resolvers for parent schema object', async () => {
            FieldValidationDefinitions['$'] = [() => {
                return new Promise((resolve) => {
                    resolve([new Error('test2')]);
                });
            }];

            const resolve = function (...args: any[]) {
                return true;
            };

            const resolve2 = function (...args: any[]) {
                return true;
            };

            const field = { resolve, name: 'Test' };
            const field2 = {
                resolve: resolve2, name: 'Test2'
            };

            const type = new GraphQLObjectType2(
                [field, field2], 'Test33'
            );

            const type2 = new GraphQLObjectType2(
                [field, field2], 'Test44'
            );

            const typesMap = {
                'Test33': type,
                'Test44': type2
            };

            const schema = new GraphQLSchema(typesMap);
            wrapResolvers(schema);

            expect(field.resolve).to.not.equal(resolve);
            expect(field2.resolve).to.not.equal(resolve2);
        });
    });
});

class GraphQLObjectTypeWithoutFields {
    constructor(public fields: any[], public name: string) {
    }
}

class GraphQLObjectTypeFieldAsObject {
    constructor(private fields: any, public name: string) {
    }

    getFields() {
        return this.fields;
    }
}

class GraphQLObjectType {
    constructor(public fields: any[], public name: string) {
    }

    getFields() {
        return this.fields;
    }
}


class GraphQLObjectType2 extends GraphQLObjectType {
    constructor(public fields: any[], public name: string) {
        super(fields, name);
    }

    getFields() {
        return this.fields;
    }
}

class GraphQLSchema2 {
    constructor(public types: any) {
    }

    getTypeMap() {
        return this.types;
    }
}

class GraphQLSchema extends GraphQLSchema2 {
    constructor(public types: any) {
        super(types);
    }

    getTypeMap() {
        return this.types;
    }
}

class FieldsType1 {
    constructor(public field) {

    }
}

class FieldsType2 extends FieldsType1 {
    constructor(public field1, field2) {
        super(field2);
    }
}