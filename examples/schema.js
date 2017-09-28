const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString
} = require('graphql');

const TestType = new GraphQLObjectType({
    name: 'TestType',
    fields: {
        fourth: {
            type: GraphQLString,
            resolve(obj) {
                return obj.first;
            }
        },
        fifth: {
            type: GraphQLString,
            resolve(obj) {
                return obj.second;
            }
        }
    }
});

const TestType2 = new GraphQLObjectType({
    name: 'TestType2',
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
        },
        third: {
            type: TestType,
            resolve(obj) {
                return {
                    first: 'sdljfl',
                    second: 'ssdf'
                };
            }
        }
    }
});

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            hello: {
                type: TestType2,
                resolve() {
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve({
                                first: 'lalalal',
                                second: 'I Have An Error'
                            });
                        }, 3000)
                    });
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
                    return new Promise((resolve, reject) => {
                        setTimeout(() => {
                            resolve({
                                first: 'dsfs',
                                second: 'dsfsdf'
                            });
                        }, 2000)
                    });
                }
            }
        }
    })
});

module.exports = schema;