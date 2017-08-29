const express = require('express');
const graphqlHTTP = require('express-graphql');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    wrapExtension
} = require("graphql-validity");

const schema = require('./schema');

const app = express();

function validateSomeTestThing(parentTypeName, field, ...args) {
    return [new Error('Wrong stuff here! ' + parentTypeName + ':' + field.name)];
}

FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:first'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:second'] = [validateSomeTestThing];

wrapResolvers(schema);

app.use('/graphql', graphqlHTTP(async (request) => {
    return {
        schema,
        graphiql: true,
        extensions: wrapExtension
    }
}));

app.listen(4000);