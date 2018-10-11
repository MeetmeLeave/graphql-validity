const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityExpressMiddleware
} = require('../../index');

const schema = require('./schema');
const PORT = 4000;

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
    profilingResultHandler: (profilingData) => {
        console.log(JSON.stringify(profilingData, null, 2));
    }
});

app.use(graphQLValidityExpressMiddleware);

app.use('/graphql', bodyParser.json(), graphqlExpress(request => ({
    schema,
    rootValue: request
})));
app.get('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }));

app.listen(PORT);
