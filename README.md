# GraphQL Validity

### What?
GraphQL Validity is a library for node.js that allows you to add a business logic validation layer to your BE, avoiding updates to your resolve functions and changing the look and fill with the graphql schema you are using.

This library originally was created for `graphql-express` package, but also supports `apollo-server`.

### Why?
This library is a result of inconvenience for validation implementation using common graphql tools in js for the business logic.

The result of graphql operation is rather a value when the operation was successful or an error if the operation has failed. That works for basic cases, like permissions validation. You grab the field, you don
t have rights to see it and you get an error if you have rights the value is there. The problem comes, when you need to have 'soft' error inside the response along with value. 

Imagine the following case:
1. A user adds a product to the cart through mutation and gets an OK response.
2. User goes back to the store to check other stock you have, meanwhile someone orders the same product user has in the cart and it is out of stock.
3. A user adds another product to the cart and gets an error, that his previous product is not available anymore. The problem is that we have to choose now, do we send an error to the user or we need to send success and then throw that error during checkout.

This basic example might sound not scary enough overall, but one way or another application might get to the point where this can become a problem and app will have to bend the logic to comply the API.

Another issue this library tries to solve is the way validation happens for the business logic in the graphql.

Those are common patterns people use to handle the validation:
1. Adding validation errors/warnings to the schema itself - the WORST of them all, you simply mix data with metadata.
2. Building functions compositions inside the resolve functions to replace resolver with validator which calls resolver after validation. - that can work, but first, you are complicating the code without any good reason. Second, you make graphql engine slower, especially if the wrapper function returns promise. And third your validation is scattered across the code and the more resolvers you have the more unneeded duplicate code you will generate. And last but not least the separation of concerns will hit you in the back, mixing things like auth, data sanity checks, and actual business logic is not the best you can do here.
3. Put validation logic inside the resolve function along with business logic - it also can work, but has similar flaws as the point 2 above.

All of those can get the job done, but if you have a growing API, which is also subject to change, or you share validation patterns through different resolve functions, you can easily make your self a bad favor by applying one of those to your code.

### How?

This library allows you to declare all the validators separately from the schema implementation and keep it readable and usable. 

It checks ease of maintenance, ease of change, and separation of concerns is also covered.

The most basic example usage:
```javascript
//imports
const express = require('express');
const graphqlHTTP = require('express-graphql');
const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityExpressMiddleware
} = require('graphql-validity');

// get the schema object
const schema = require('./schema');

const app = express();

// Define validator functions
// each function should throw an error or return array of error objects or an empty array if everything is good

function applyGlobally(...args) {
    return [new Error('Global failure!')];
}

// Define what to validate:
// $ will be checked ones, but for any resolver called
FieldValidationDefinitions['$'] = [applyGlobally];

// Wraps your resolvers schema with validators automatically
wrapResolvers(schema);

// Add middleware to express to make this lib work, as we need to connect schema validation 
// results with request/response we got
app.use(graphQLValidityExpressMiddleware);

app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        // Do not forget to pass your request as a rootValue, 
        // as we need to connect custom validation execution result with response
        rootValue: request
    }
}));

app.listen(4000);
```

To make it work you have to do the following things:

Import the code:
```javascript
const {
    FieldValidationDefinitions,
    wrapResolvers,
    graphQLValidityExpressMiddleware
} = require('graphql-validity');
```
Add validation function to a certain level of schema, by passing an array of functions doing the validation:
```javascript
FieldValidationDefinitions['$'] = [applyGlobally];
```
 Call the wrapResolvers function with your schema object as a parameter:
 ```javascript
wrapResolvers(schema);
```
Add the middleware to your express instance, imported above:
```javascript
app.use(graphQLValidityExpressMiddleware);
```
Add the express request object to the rootValue of your graphql express instance
```javascript
app.use('/graphql', graphqlHTTP((request) => {
    return {
        schema,
        graphiql: true,
        // Do not forget to pass your request as a rootValue, 
        // as we need to connect custom validation execution result with response
        rootValue: request
    }
}));
```
 
 The reason why this process has so many stages is that graphql instance resolution is separate from the actual `express` work, so it adds a couple of additional stages I could not avoid when I was writing this library.
 
 ### Advanced configuration level
 
 There is a certain level of validation for the schema:
 1. The first resolver encountered, checked only once:
`FieldValidationDefinitions['$']` - usually used for permissions validation.
2. All of the resolvers available:
`FieldValidationDefinitions['*']` - rarely used, but still can be applied to something like input sanity checks for each field of the object.
3. All the resolvers for a particular field:
`FieldValidationDefinitions['TestType']` - can be used to check all the fields of the given object
4. Resolver for particular object field:
`FieldValidationDefinitions['TestType:first']` - the example usage will be to have an object with public fields and a single private filed, which can be accessed only by the authorized person. For example user object which contains a password field, or personal address.
