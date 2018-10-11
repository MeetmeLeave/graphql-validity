const koa = require('koa'); // koa@2
const koaRouter = require('koa-router'); // koa-router@next
const koaBody = require('koa-bodyparser'); // koa-bodyparser@next
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityKoaMiddleware
} = require('../../lib/index');

const schema = require('./schema');

const app = new koa();
const router = new koaRouter();
const PORT = 4000;

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

app.use(graphQLValidityKoaMiddleware);

// koaBody is needed just for POST.
router.post('/graphql', koaBody(), graphqlKoa(ctx => (
    {
        schema: schema,
        rootValue: ctx.req
    }
)));
router.get('/graphql', graphqlKoa(ctx => (
    {
        schema: schema,
        rootValue: ctx.req
    }
)));

router.get('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(PORT);
