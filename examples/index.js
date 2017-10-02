const express = require('express');
const graphqlHTTP = require('express-graphql');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityMiddleware
} = require('../lib');

const schema = require('./schema');

const app = express();

function validateSomeTestThing(...args) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve([new Error('Wrong stuff here!')]);
        }, 130)
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

function specialThird(...args) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve([new Error('Special third failed!')]);
        }, 250)
    });
}

FieldValidationDefinitions['$'] = [applyGlobally];
// FieldValidationDefinitions['*'] = [applyToAll];
FieldValidationDefinitions['Mutation:testMutation'] = [validateSomeTestMutation];
FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:fourth'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:fifth'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:first'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:second'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:third'] = [specialThird];

wrapResolvers(schema, {
    wrapErrors: true,
    enableProfiling: true,
    profilingResultHandler: (profilingResult) => {
        // console.log(JSON.stringify(Array.from(Object.keys(profilingResult)).map(o=>profilingResult[o].profile), null, 2));
        console.log(JSON.stringify(profilingResult, null, 2));
    }
});

app.use(graphQLValidityMiddleware);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        rootValue: request
    }
}));

app.listen(4000);