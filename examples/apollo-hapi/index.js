const hapi = require('hapi');
const { graphqlHapi } = require('apollo-server-hapi');
const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityHapiMiddleware
} = require('../../lib/index');

const schema = require('./schema');

const server = new hapi.Server({ debug: { request: "*" } });

const HOST = 'localhost';
const PORT = 4000;

server.connection({
    host: HOST,
    port: PORT,
});


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

graphQLValidityHapiMiddleware(server);

server.register({
    register: graphqlHapi,
    options: {
        path: '/graphql',
        graphqlOptions: {
            schema: schema,
        },
        route: {
            cors: true
        }
    },
});

server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
});
