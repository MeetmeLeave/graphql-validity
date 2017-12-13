const express = require('express');
const graphqlHTTP = require('express-graphql');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityExpressMiddleware,
    ValidityError
} = require('../../lib/index');

const schema = require('./schema');

const app = express();

function validateSomeTestThing(...args) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject('Wrong stuff here!');
        }, 1300)
    });
}

function applyToAll(...args) {
    return [new Error('All failed!')];
}

function applyGlobally(...args) {
    return [new Error('Global failure!')];
}

function validateSomeTestMutation(...args) {
    return [new Error('testMutation failed!')];
}

function validateSomeTestMutationEmptyReturn(...args) {
    return;
}

function specialThird(...args) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(new ValidityError('Special third failed!'));
        }, 250)
    });
}

function specialFourth(...args) {
    throw new Error('Special fourth failed!');
}

FieldValidationDefinitions['$'] = [applyGlobally];
FieldValidationDefinitions['Mutation:testMutation'] = [validateSomeTestMutation];
FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:fourth'] = [specialFourth];
FieldValidationDefinitions['TestType:fifth'] = [validateSomeTestMutationEmptyReturn];
FieldValidationDefinitions['TestType2:first'] = [validateSomeTestThing];
// FieldValidationDefinitions['TestType2:second'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:third'] = [specialThird];

wrapResolvers(schema, {
    wrapErrors: true
});

app.use(graphQLValidityExpressMiddleware);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        rootValue: request
    }
}));

app.listen(4000);