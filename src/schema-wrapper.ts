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

import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { uuid } from './uuid';

/**
 * Contains configuration options for the main function
 */
export declare type ValidityConfig = {
    wrapErrors: boolean;
    enableProfiling: boolean;
    unhandledErrorWrapper?: (error: Error) => Error;
    profilingResultHandler?: (profilingResult: any) => void;
}

// Indicates whether schema entity was already processed
export const Processed = Symbol();

/* An object which stores all validator functions
    required to be executed during graphql request */
export const FieldValidationDefinitions: any = {};

/**
 * Default error wrapper function to hide error info from end users
 *
 * @param {Error} error - unhandled error object
 * @returns {Error} - error object with critical data hidden
 */
function onUnhandledError(error: Error) {
    const id = uuid();

    console.error(`Unhandled error occured with id:${id}, stack:${error.stack}`);

    return new Error(`An internal error occured, with following id:${id}, please contact Administrator!`)
}

// The default profiling result display
let profilingResultHandler = (profilingResult: any) => {
    console.log(JSON.stringify(profilingResult, null, 2));
};

/**
 * Middleware which will capture validation output and will add it to the original response
 *
 * @param req - express request
 * @param res - express response
 * @param next - next call
 */
export function graphQLValidityMiddleware(req: any, res: any, next: any) {
    try {
        let originalSend = res.send;
        req.__graphQLValidity = {
            ___validationResults: [],
            ___globalValidationResults: undefined,
            ___profilingData: []
        };

        res.send = function (data: any) {
            try {
                let result = JSON.parse(data);
                const validity = req.__graphQLValidity;

                if (result.data) {
                    getResponseValidationResults(validity, result);
                    arguments[0] = JSON.stringify(result);
                }

                setTimeout(() => {
                    const profilingData = validity.___profilingData;
                    profilingResultHandler(profilingData);
                }, 1000);
            }
            catch (err) {
                console.error(err)
            }
            finally {
                originalSend.apply(res, Array.from(arguments));
            }
        }
    }
    catch (err) {
        console.error(err)
    }
    finally {
        next();
    }
}

/**
 * Builds errors array, using validation and global validation results
 *
 * @param validity - an object injected to request at the beginning of the http call
 * @param data - result of graphql call
 */
function getResponseValidationResults(validity: any, data: any) {
    let globalValidationResults = validity.___globalValidationResults
        || [];
    data.errors =
        (data.errors || [])
            .concat(
                validity.___validationResults.map(
                    error => {
                        return {
                            message: error.message
                        };
                    })
            )
            .concat(
                globalValidationResults.map(error => {
                    return {
                        message: error.message
                    };
                })
            );
}

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

        if (config.profilingResultHandler) {
            profilingResultHandler = config.profilingResultHandler ?
                config.profilingResultHandler : profilingResultHandler;
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
    field.resolve = async function (...args: any[]) {
        try {
            // profiling start time
            var pst = Date.now();
            let parentTypeName;
            let ast;
            let validity;
            for (let arg of [...args]) {
                if (arg && arg.rootValue && arg.rootValue.__graphQLValidity) {
                    validity = arg.rootValue.__graphQLValidity;
                }

                if (arg && arg.parentType) {
                    ast = arg;
                    parentTypeName = arg.parentType;
                }
            }

            if (validity) {
                let {
                    validationResults,
                    globalValidationResults
                } = getValidationResults(validity);

                let {
                    validators,
                    globalValidators
                } = getValidators(field, parentTypeName);

                if (!globalValidationResults) {
                    validity.___globalValidationResults = [];
                    globalValidationResults = validity.___globalValidationResults;
                    for (let validator of globalValidators) {
                        Array.prototype.push.apply(
                            globalValidationResults,
                            await validator.call(this, ...args)
                        );
                    }
                }

                for (let validator of validators) {
                    Array.prototype.push.apply(
                        validationResults,
                        await validator.call(this, ...args)
                    );
                }
            }

            // validation end time
            const vet = Date.now();
            let result = await resolve.call(this, ...args);
            // execution end time
            const eet = Date.now();

            try {
                if (validity && config.enableProfiling) {
                    storeProfilingInfo(validity, ast.path, {
                        name: field.name,
                        validation: (vet - pst),
                        execution: (eet - pst),
                        fieldsExecution: 0,
                        totalExecution: (eet - pst) - (vet - pst)
                    });
                }
            }
            catch (err) {
                console.error('Profiling failed!', err);
            }

            return result;
        } catch (e) {
            if (config.wrapErrors) {
                throw config.unhandledErrorWrapper(e);
            }

            throw e;
        }
    };
}

/**
 * Capture profiling info for later processing
 *
 * @param validity - object which stores profiling info
 * @param path - AST path to the field and its resolver
 * @param profile - profiling info collected
 */
function storeProfilingInfo(validity: any, path: any, profile: any) {
    validity.___profilingData.push({ path, profile });
}

/**
 * Returns lists of graphql validation messages arrays from request object
 *
 * @param request - express request object
 * @returns {{validationResults: any; globalValidationResults: any}} -
 * list of validation result messages for both local and global validators
 */
function getValidationResults(validity: any) {
    let validationResults = validity.___validationResults;

    if (!validationResults) {
        validity.___validationResults = [];
        validationResults = validity.___validationResults;
    }

    let globalValidationResults = validity.___globalValidationResults;

    return {
        validationResults,
        globalValidationResults
    }
}

/**
 * Return list of local and global validators
 *
 * @param field - field which will be validated
 * @param {string} parentTypeName - name of the parent object where field belongs to
 * @returns {{validators: T[]; globalValidators: (any | Array)}}
 * - list of local and global validator functions
 */
function getValidators(field: any, parentTypeName: string) {
    let validators =
        (
            FieldValidationDefinitions['*']
            || []
        ).concat
        (
            FieldValidationDefinitions[field.type]
            || []
        ).concat
        (
            FieldValidationDefinitions[parentTypeName + ':' + field.name]
            || []
        )

    let globalValidators = FieldValidationDefinitions['$'] || [];

    return {
        validators,
        globalValidators
    }
}

/**
 * Wraps each field of the GraphQLObjectType entity
 *
 * @param {GraphQLObjectType} type - GraphQLObject schema entity
 * @param {ValidityConfig} config - setup options for the wrapper function
 */
function wrapType(type: GraphQLObjectType, config: ValidityConfig) {
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
function wrapSchema(schema: GraphQLSchema, config: ValidityConfig) {
    const types = schema.getTypeMap();
    for (const typeName in types) {
        if (!Object.hasOwnProperty.call(types, typeName)) {
            continue;
        }

        wrapType(<GraphQLObjectType>types[typeName], config);
    }
}