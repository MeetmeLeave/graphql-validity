const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList
} = require('graphql');

const {
    DataValidationResult
} = require('../../lib/index');

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
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve(obj.second);
                    }, 400);
                });
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
                let result = new DataValidationResult();
                result.data = obj.first;
                result.errors = [new Error('111111111111'), new Error('2222222')];
                return result;
            }
        },
        third: {
            type: new GraphQLList(TestType),
            resolve(obj) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        resolve([{
                            first: 'sdljfl',
                            second: 'ssdf'
                        }, {
                            first: '2',
                            second: '2'
                        }, {
                            first: '3',
                            second: '3'
                        }]);
                    }, 400);
                });
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