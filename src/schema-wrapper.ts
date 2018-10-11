/*!
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 Vlad Martynenko <vladimir.martynenko.work@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Contains configuration options for the main function
 */
import {
    FieldValidationObject,
    onUnhandledError,
    ValidityConfig
} from "./helpers";
import {
    defaultProfilingResultHandler,
    storeProfilingInfo
} from "./profiling";
import {
    getValidationResults,
    getValidators
} from "./validation";

import hapiMiddleware from './hapi-middleware';
import expressMiddleware from './express-middleware';
import koaMiddleware from './koa-middleware';

// Indicates whether schema entity was already processed
export const Processed = Symbol();

let profilingResultHandler: any = {
    handler: defaultProfilingResultHandler
};

// Set of middleware functions for express, koa and hapi servers
export const graphQLValidityHapiMiddleware = hapiMiddleware(profilingResultHandler);
export const graphQLValidityExpressMiddleware = expressMiddleware(profilingResultHandler);
export const graphQLValidityKoaMiddleware = koaMiddleware(profilingResultHandler);

/**
 * Top level wrapper for the GraphQL schema entities
 * which replaces resolve function if any found
 *
 * @param entity - GraphQL object entity
 * @param {ValidityConfig} config - setup options for the wrapper function
 */
export function wrapResolvers(entity: any, config?: ValidityConfig) {
    if (!config) {
        config = {
            wrapErrors: false,
            enableProfiling: false,
            unhandledErrorWrapper: onUnhandledError
        }
    }
    else {
        config.unhandledErrorWrapper = config.unhandledErrorWrapper
            || onUnhandledError;

        if (config.enableProfiling) {
            profilingResultHandler.handler = config.profilingResultHandler ?
                config.profilingResultHandler : profilingResultHandler.handler;
        }
    }
    if (entity.constructor.name === 'GraphQLSchema') {
        wrapSchema(entity, config);
    } else if (entity.constructor.name === 'GraphQLObjectType') {
        wrapType(entity, config);
    } else {
        wrapField(entity, config);
    }
}

/**
 * Internal function which performs resolvers wrapping with common async function
 *
 * @param field - GraphQL entity field
 * @param {ValidityConfig} config - setup options for the wrapper function
 */
function wrapField(
    field: any,
    config: ValidityConfig
) {
    const resolve = field.resolve;
    if (field[Processed] || !resolve) {
        return;
    }

    field[Processed] = true;

    field.resolve = validateFieldResolution(field, config, resolve);
}

/**
 * Creates new field resolver for a given graphql field node
 *
 * @param field - field node which gets resolver replaced
 * @param {ValidityConfig} config - config options for validation
 * @param {Function} resolver - original resolver function
 *
 * @returns {(...args: any[]) => (Promise<any> | any)} - new resolver function
 */
function validateFieldResolution(
    field: any,
    config: ValidityConfig,
    resolver: Function
) {
    return function (...args: any[]) {
        const requestContext: FieldValidationObject = { fieldName: field.name };

        if (config.enableProfiling) {
            // profiling start time
            requestContext.pst = Date.now();
        }

        for (let i = 0, s = args.length; i < s; i++) {
            let arg = args[i];
            if (arg && arg.rootValue && arg.rootValue.__graphQLValidity) {
                arg.rootValue.__graphQLValidity.config = config;
                requestContext.validity = arg.rootValue.__graphQLValidity;
            }

            if (arg && arg.parentType) {
                requestContext.astPath = arg.path;
                requestContext.parentTypeName = arg.parentType;
            }
        }

        if (requestContext.validity) {
            let validationResults = getValidationResults(requestContext.validity);
            let validators = getValidators(
                field,
                String(requestContext.parentTypeName),
                requestContext.validity
            );

            const result = processValidators(validators, validationResults, args);
            if (result && result.then) {
                return new Promise((
                    resolve: Function,
                    reject: Function
                ) => {
                    result.then(() => {
                        if (config.enableProfiling) {
                            // validation end time
                            requestContext.vet = Date.now();
                        }

                        const result = resolver.apply(this, args);

                        if (config.enableProfiling) {
                            if (result && result.then) {
                                result.then(() => {
                                    processProfiling(requestContext);
                                })
                            }
                            else {
                                processProfiling(requestContext);
                            }
                        }

                        resolve(result);
                    }).catch(e => {
                        reject(e);
                    });
                });
            }
            else {
                if (config.enableProfiling) {
                    // validation end time
                    requestContext.vet = Date.now();
                }
            }
        }

        const result = resolver.apply(this, args);

        if (config.enableProfiling) {
            if (result && result.then) {
                result.then(() => {
                    processProfiling(requestContext);
                });
            }
            else {
                processProfiling(requestContext);
            }
        }

        return result;
    };
}

/**
 * Creates profiling data using process context for a field
 *
 * @param {FieldValidationObject} requestContext - data gathered during field validation and execution
 */
function processProfiling(requestContext: FieldValidationObject) {
    // execution end time
    requestContext.eet = Date.now();

    try {
        if (requestContext.validity) {
            const validation = <number>requestContext.vet - <number>requestContext.pst;
            const execution = <number>requestContext.eet - <number>requestContext.vet;
            storeProfilingInfo(requestContext.validity, requestContext.astPath, {
                name: requestContext.fieldName,
                validation,
                execution,
                fieldsExecution: 0,
                totalExecution: validation + execution
            });
        }
    }
    catch (err) {
        console.error('Profiling failed!', err);
    }
}

/**
 * Validator function executor
 *
 * @param {Function[]} validators - array of validation functions
 * @param {any[]} validationResults - static array of validation results
 * @param {any[]} args - original resolver arguments
 *
 * @returns {Promise<void>} - return promise if at least one validator was returning promise
 */
function processValidators(
    validators: Function[],
    validationResults: any[],
    args: any[]
) {
    let promises = [];

    for (let i = 0, s = validators.length; i < s; i++) {
        let validator = validators[i];
        let validationResult = validator.apply(this, args) || [];
        if (validationResult.then) {
            promises.push(validationResult);
        }
        else {
            validationResult = Array.isArray(validationResult) ? validationResult : [validationResult];

            Array.prototype.push.apply(
                validationResults,
                validationResult
            );
        }
    }

    if (promises.length) {
        return handleValidationPromises(promises, validationResults);
    }
}

/**
 * Synchronises validator promises execution
 *
 * @param {any[]} promises - array of validator promises
 * @param {any[]} validationResults - static array of validation results
 *
 * @returns {Promise<void>} - general promise for all validator promises
 */
async function handleValidationPromises(
    promises: any[],
    validationResults: any[]
) {
    for (let promise of promises) {
        let validationResult = (await promise) || [];
        validationResult = Array.isArray(validationResult) ? validationResult : [validationResult];

        Array.prototype.push.apply(
            validationResults,
            validationResult
        );
    }
}

/**
 * Wraps each field of the GraphQLObjectType entity
 *
 * @param {GraphQLObjectType} type - GraphQLObject schema entity
 * @param {ValidityConfig} config - setup options for the wrapper function
 */
function wrapType(type: any, config: ValidityConfig) {
    if (type[Processed] || !type.getFields) {
        return;
    }

    const fields = type.getFields();
    for (const fieldName in fields) {
        if (!Object.hasOwnProperty.call(fields, fieldName)) {
            continue;
        }

        wrapField(fields[fieldName], config);
    }
}

/**
 * Wraps each GraphQLObjectType fields resolver for entire GraphQL Schema
 *
 * @param {GraphQLSchema} schema - schema object that must be wrapped
 * @param {ValidityConfig} config - setup options for the wrapper function
 */
function wrapSchema(schema: any, config: ValidityConfig) {
    const types = schema.getTypeMap();
    for (const typeName in types) {
        if (!Object.hasOwnProperty.call(types, typeName)) {
            continue;
        }

        wrapType(<any>types[typeName], config);
    }
}