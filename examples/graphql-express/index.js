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
        // setTimeout(() => {
        //     reject('Wrong stuff here!');
        // }, 1300)
        reject('Wrong stuff here!');
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
        }, 2500);
        // resolve(new ValidityError('Special third failed!'));
    });
}

function specialFourth(...args) {
    // return [new Error('Special fourth failed!')];
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve([new Error('Special fourth failed!')])
        }, 1300);
    });
}

FieldValidationDefinitions['$'] = [applyGlobally];
FieldValidationDefinitions['Mutation:testMutation'] = [validateSomeTestMutation];
// FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:fourth'] = [specialFourth, specialFourth];
FieldValidationDefinitions['TestType:fifth'] = [validateSomeTestMutationEmptyReturn];
// FieldValidationDefinitions['TestType2:first'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:second'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType2:third'] = [specialThird];

wrapResolvers(schema, {
    wrapErrors: true,
    enableProfiling: true,
    profilingResultHandler: (profilingData, __graphQLValidityRequestId) => {
        console.log(JSON.stringify(profilingData, null, 2));
        console.log(__graphQLValidityRequestId);
    }
});

function loggingMiddleware(req, res, next) {
    try {
        const id = '123-234-222-111';
        req.__graphQLValidityRequestId = id;
        const startTime = new Date();

        let originalSend = res.send;
        res.send = function (data) {
            const diff = new Date() - startTime;
            console.log('Execution diff:', diff / 1000);
            originalSend.apply(res, Array.from(arguments));
        }
    }
    catch (err) {
        console.error(err)
    }
    finally {
        next();
    }
}

app.use(graphQLValidityExpressMiddleware);
app.use(loggingMiddleware);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        rootValue: request
    }
}));

app.listen(4000);
