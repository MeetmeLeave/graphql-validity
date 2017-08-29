export const Processed = Symbol();
export const FieldValidationDefinitions: any = {};

export function wrapExtension(request) {
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

export function wrapResolvers(entity: any, parentTypeName: string = '') {
    if (entity.constructor.name === 'GraphQLSchema') {
        wrapSchema(entity);
    } else if (entity.constructor.name === 'GraphQLObjectType') {
        wrapType(entity);
    } else {
        wrapField(entity, parentTypeName);
    }
}

function wrapField(field: any, parentTypeName: string) {
    const resolve = field.resolve;
    if (field[Processed] || !resolve) {
        return;
    }

    field[Processed] = true;
    field.resolve = async function (...args: any[]) {
        try {
            let validationResults = args[2].___validationResults;

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

            return await resolve.call(this, ...args);
        } catch (e) {
            throw e;
        }
    };
}

function wrapType(type: any) {
    if (type[Processed] || !type.getFields) {
        return;
    }

    const fields = type.getFields();
    for (const fieldName in fields) {
        if (!Object.hasOwnProperty.call(fields, fieldName)) {
            continue;
        }

        wrapField(fields[fieldName], type);
    }
}

function wrapSchema(schema: any) {
    const types = schema.getTypeMap();
    for (const typeName in types) {
        if (!Object.hasOwnProperty.call(types, typeName)) {
            continue;
        }

        wrapType(types[typeName]);
    }
}