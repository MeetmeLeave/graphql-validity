# GraphQL Validity

The original purpose of this library is to make business logic validation easy on the graphql side without adding any declarations or modifications to the existing graphql schema.

There are common patterns which fill really wrong to perform business logic validation inside the graphql:
1. Adding validation errors/warnings to the schema itself
2. Building functions compositions inside the resolve functions to replace resolver with validator which calls resolver after validation
3. Put validation logic inside the resolve function along with business logic

This library allows you to declare all the validators separately from the schema implementation and keep them readable and usable.

The basic example usage will be as follow
```javascript
//imports
const express = require('express');
const graphqlHTTP = require('express-graphql');
const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityMiddleware
} = require('graphql-validity');

// get the schema object
const schema = require('./schema');

const app = express();

// define validator functions
// each function should throw an error or return array of error objects
function validateSomeTestThing(...args) {
    return [new Error('Wrong stuff here!')];
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

// define where to use validator, $ will checked ones, but for any resolver called
// * - will be called for each resolver
// ObjectName:FieldName - Will be called for a field resolver on a particular object
// ObjectName - Will be called for each resolver field on a particular object
FieldValidationDefinitions['$'] = [applyGlobally];
FieldValidationDefinitions['*'] = [applyToAll];
FieldValidationDefinitions['Mutation:testMutation'] = [validateSomeTestMutation];
FieldValidationDefinitions['TestType'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:first'] = [validateSomeTestThing];
FieldValidationDefinitions['TestType:second'] = [validateSomeTestThing];

// wraps your resolvers schema with validators automatically
wrapResolvers(schema);

// add middleware to express to make this lib work, as we need to connect schema validation 
// results with request/response we got
app.use(graphQLValidityMiddleware);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        rootValue: request
    }
}));

app.listen(4000);
```

More info and stuff will come in the future as lib is still work in progress check the examples section for more detailed example..

The current road map:

1. Stabilization, tests, examples, etc.
2. Adding optional performance checks to track speed of each call
3. Adding optional built in logging of requests
4. Adding third party output options like warnings/info etc along data and errors