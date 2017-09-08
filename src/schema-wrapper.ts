import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { uuid } from './uuid';

/**
 * Contains configuration options for the main function
 */
export declare type ValidityConfig = {
    wrapErrors: boolean;
    unhandledErrorWrapper?: Function;
    parentTypeName?: string;
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

/**
 * Must be used to wrap the extension variable on the graphqlHTTP object
 *
 * @param request - http request object, from the express middleware.
 * @returns {Function} - returns function for the extension variable
 * which adds additional changes to the result object.
 */
export function wrapExtension(request): Function {
    if (request) {
        request.___validationResults = [];
        request.___globalValidationResults;

        return function ({ result }: any) {
            let globalValidationResults = request.___globalValidationResults
                || [];
            result.errors =
                (result.errors || [])
                    .concat(
                        request.___validationResults.map(error => {
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

            return null;
        }
    }
    else {
        return function (...args: any[]) {
            return null;
        }
    }
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
            unhandledErrorWrapper: onUnhandledError,
            parentTypeName: ''
        }
    }
    else {
        config.unhandledErrorWrapper = config.unhandledErrorWrapper
            || onUnhandledError;
        config.parentTypeName = config.parentTypeName
            || '';
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
    config: ValidityConfig,
    parentTypeName?: string
) {
    parentTypeName = parentTypeName || config.parentTypeName;

    const resolve = field.resolve;
    if (field[Processed] || !resolve) {
        return;
    }

    field[Processed] = true;
    field.resolve = async function (...args: any[]) {
        try {
            let request;
            for (let arg of [...args]) {
                if (arg && arg.___validationResults) {
                    request = arg;
                    break;
                }
            }

            if (request) {
                let {
                    validationResults,
                    globalValidationResults
                } = getValidationResults(request);

                let {
                    validators,
                    globalValidators
                } = getValidators(field, parentTypeName);

                if (!globalValidationResults) {
                    request.___globalValidationResults = [];
                    globalValidationResults = request.___globalValidationResults;
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

            return await resolve.call(this, ...args);
        } catch (e) {
            if (config.wrapErrors) {
                throw config.unhandledErrorWrapper(e);
            }

            throw e;
        }
    };
}

/**
 * Returns lists of graphql validation messages arrays from request object
 *
 * @param request - express request object
 * @returns {{validationResults: any; globalValidationResults: any}} -
 * list of validation result messages for both local and global validators
 */
function getValidationResults(request: any) {
    let validationResults = request.___validationResults;

    if (!validationResults) {
        request.___validationResults = [];
        validationResults = request.___validationResults;
    }

    let globalValidationResults = request.___globalValidationResults;

    return {
        validationResults,
        globalValidationResults
    }
}

/**
 * Return list of local and global validators
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

        wrapField(fields[fieldName], config, type.name);
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