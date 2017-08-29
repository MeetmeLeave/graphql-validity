const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} = require('graphql');

const TestType = new GraphQLObjectType({
    name: 'TestType',
    fields: {
        first: {
            type: GraphQLString,
            resolve(obj) {
                return obj.first;
            }
        },
        second: {
            type: GraphQLString,
            resolve(obj) {
                return obj.second;
            }
        }
    }
});

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            hello: {
                type: TestType,
                resolve() {
                    return {
                        first: 'lala',
                        second: 'I HAVE AN ERROR',
                    }
                }
            }
        }
    }),
    mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
            testMutation: {
                type: TestType,
                args: {
                    test: {
                        type: GraphQLString
                    }
                },
                resolve() {
                    return {
                        first: 'dsfs',
                        second: 'dsfsdf'
                    }
                }
            }
        }
    })
});

module.exports = schema;