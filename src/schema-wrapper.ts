import { GraphQLObjectType, GraphQLSchema } from "graphql";

// Indicates whether schema entity was already processed
export const Processed = Symbol();

/* An object which stores all validator functions
    required to be executed during graphql request */
export const FieldValidationDefinitions: any = {};

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

        return function ({ result }: any) {
            result.errors =
                (result.errors || [])
                    .concat(
                        request.___validationResults.map(error => {
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
 * @param {string} parentTypeName - name of the parent object
 * if used to wrap field directly
 */
export function wrapResolvers(entity: any, parentTypeName: string = '') {
    if (entity.constructor.name === 'GraphQLSchema') {
        wrapSchema(entity);
    } else if (entity.constructor.name === 'GraphQLObjectType') {
        wrapType(entity);
    } else {
        wrapField(entity, parentTypeName);
    }
}

/**
 * Internal function which performs resolvers wrapping with common async function
 *
 * @param field - GraphQL entity field
 * @param {string} parentTypeName - field's parent object name
 */
function wrapField(field: any, parentTypeName: string) {
    const resolve = field.resolve;
    if (field[Processed] || !resolve) {
        return;
    }

    field[Processed] = true;
    field.resolve = async function (...args: any[]) {
        try {
            if (args[2]) {
                let validationResults = args[2].___validationResults;

                if (!validationResults) {
                    args[2].___validationResults = [];
                    validationResults = args[2].___validationResults;
                }

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

                for (let validator of validators) {
                    Array.prototype.push.apply(
                        validationResults,
                        await validator.call(this, ...args)
                    );
                }
            }

            return await resolve.call(this, ...args);
        } catch (e) {
            throw e;
        }
    };
}

/**
 * Wraps each field of the GraphQLObjectType entity
 *
 * @param {GraphQLObjectType} type - GraphQLObject schema entity
 */
function wrapType(type: GraphQLObjectType) {
    if (type[Processed] || !type.getFields) {
        return;
    }

    const fields = type.getFields();
    for (const fieldName in fields) {
        if (!Object.hasOwnProperty.call(fields, fieldName)) {
            continue;
        }

        wrapField(fields[fieldName], type.name);
    }
}

/**
 * Wraps each GraphQLObjectType fields resolver for entire GraphQL Schema
 *
 * @param {GraphQLSchema} schema - schema object that must be wrapped
 */
function wrapSchema(schema: GraphQLSchema) {
    const types = schema.getTypeMap();
    for (const typeName in types) {
        if (!Object.hasOwnProperty.call(types, typeName)) {
            continue;
        }

        wrapType(<GraphQLObjectType>types[typeName]);
    }
}