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

Next you can try the following mutation:
```graphql
mutation{
  testMutation(test:"3") {
    fourth
    fifth
  }
}
```

Crazy test query:
```graphql
query testSuperQuery($test: Boolean!, $test2: Boolean!) {
  hello {
    first
    ...asf
    ... on TestType2 @include(if: $test) {
      second
    }
  }
  dsfsdf: hello @skip(if :$test2) {
    first 
    second 
  }
}

fragment asf on TestType2 {
  second
}
```

Another test query
```graphql
{
  hello {
    first
    second
    third {
      fourth
      fifth
    }
  }
}
```