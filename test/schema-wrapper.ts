import { expect } from 'chai';
import * as sinon from 'sinon';

import {
    wrapResolvers,
    Processed,
    graphQLValidityHapiMiddleware,
    graphQLValidityExpressMiddleware,
    graphQLValidityKoaMiddleware
} from '../lib/schema-wrapper';
import { ValidityConfig } from "../lib/helpers";

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

        });

        it('resolve should perform validation if validity is set up', async () => {

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