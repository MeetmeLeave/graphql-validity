const express = require('express');
const graphqlHTTP = require('express-graphql');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    wrapExtension
} = require("../lib");

const schema = require('./schema');

const app = express();

function validateSomeTestThing(...args) {
    return [new Error('Wrong stuff here!')];
}

function applyToAll(...args) {
    return [new Error('All failed!')];
}

function validateSomeTestMutation(...args) {
    return [new Error('testMutation failed!')];
}

FieldValidationDefinitions['*'] = [applyToAll];
FieldValidationDefinitions['Mutation:testMutation'] = [validateSomeTestMutation];
// FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:first'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:second'] = [validateSomeTestThing];

wrapResolvers(schema);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        extensions: wrapExtension(request)
    }
}));

app.listen(4000);