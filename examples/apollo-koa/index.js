const koa = require('koa'); // koa@2
const koaRouter = require('koa-router'); // koa-router@next
const koaBody = require('koa-bodyparser'); // koa-bodyparser@next
const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');

const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityExpressMiddleware
} = require('../../lib/index');

const schema = require('./schema');

const app = new koa();
const router = new koaRouter();
const PORT = 3000;

// koaBody is needed just for POST.
router.post('/graphql', koaBody(), graphqlKoa({ schema: schema }));
router.get('/graphql', graphqlKoa(request => (
    {
        schema: schema,
        rootValue: request
    }
)));

router.get('/graphiql', graphiqlKoa({ endpointURL: '/graphql' }));

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(PORT);