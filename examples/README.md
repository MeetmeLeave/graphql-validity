Basic example of graphql-validity usage

Call this script after npm install:

```bash
npm test
```

Go to localhost:4000/graphql and execute following query:
```graphql
query {
  hello {
    first
    second
  }
}
```

Next you can try the following mutation
```graphql
mutation{
  testMutation(test:"3") {
    first
    second
  }
}
```