const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList
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
                return new Promise((resolve, reject) => {
                    // setTimeout(() => {
                    //     resolve(obj.second);
                    // }, 400);
                    resolve(obj.second);
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
                return new Promise((resolve, reject) => {
                    reject('First field failure');
                    return obj.first;
                });
            }
        },
        second: {
            type: GraphQLString,
            resolve(obj) {
                return obj.first;
            }
        },
        third: {
            type: new GraphQLList(TestType),
            resolve(obj) {
                return [{
                    first: 'sdljfl',
                    second: 'ssdf'
                }, {
                    first: '2',
                    second: '2'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }, {
                    first: '3',
                    second: '3'
                }]
            }
        }
    }
});

const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'RootQueryType',
        fields: {
            hello: {
                type: new GraphQLList(TestType2),
                resolve() {
                    return new Promise((resolve, reject) => {
                        // setTimeout(() => {
                        //     resolve({
                        //         first: 'lalalal',
                        //         second: 'I Have An Error'
                        //     });
                        // }, 3000)
                        resolve([{
                            first: 'lalalal',
                            second: 'I Have An Error'
                        }]);
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
                        // setTimeout(() => {
                        //     resolve({
                        //         first: 'dsfs',
                        //         second: 'dsfsdf'
                        //     });
                        // }, 2000)
                        resolve({
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        }, {
                            first: 'dsfs',
                            second: 'dsfsdf'
                        });
                    });
                }
            }
        }
    })
});

module.exports = schema;
