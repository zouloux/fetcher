# fetcher

Fetcher is a ![](./bits/index.es2017.min.js.svg) helper to build pre-configured fetch functions with strict type.

## Quick example

```typescript
import { createFetcher } from "./fetcher";

// A random user object
interface IUser {
    id	:number
    name:string
}

// Create a new fetcher, usable everywhere in your project
const fetchUser = createFetcher<[number], IUser>({
    base: '/api/1.0',
    buildURI (request, args) {
        return `get-user/${args[0]}`
    }
})

// Somewhere else in your code ...
const user = await fetchUser( 12 )
console.log(user.name) // Jean-Mi
```

## Example with complex types :

```typescript
// RestFetcher request type descriptors
type RestFetcher = {
    // Arguments of the fetcher
    args: ['get-user', { id:number }],
    // And its response
    response: IUser
} | {
    // Other example with one argument as a string
    args: [`get-user/${number}`],
    response: IUser
}

// Create the fetcher and pass the type descriptors
const restFetcher = createFetcher<RestFetcher["args"], RestFetcher["response"]>({
    // Prepend before each fetch uri
    base: '/api/1.0/',
    responseType: 'json',
    // Will build the URI
    buildURI ( request, args ) {
        return args[0] + '/' + args[1].id 
    }
})

// Get object of ID 12 following first descriptor
const result1 = await restFetcher('get-user', { id: 12 })
// Executed : fetch('/api/1.0/get-user/12')
console.log( result1.name ) // Jean-Mi 

// Get object of ID 14 following second descriptor
const result2 = await restFetcher('get-user/14')
// Executed : fetch('/api/1.0/get-user/14')
console.log( result2.name ) // Albert

// 🚫 Typescript will reject those
const result3 = await restFetcher('get-a-user', { id: 12 }) // wrong first argument
const result4 = await restFetcher('get-user/') // missing id in string or as object
const result5 = await restFetcher('get-user/turlututu') // not a number
```

## API / Usage

```typescript
const myThunkFetcher = createFetcher({
    base: string,			// base prepend to the uri
    request: RequestInit, 	// the base fetch request init object
    // Build the fetch URI
    // Request here is the request object sent to fetch
    // Args is the argument array sent by the thunk function ['Arg1', 'Arg2']
    buildURI ( request, args ) {
        return `/api/1.0/${args[0]}`
    },
    // Build the GET parameters
    buildGet ( request, args ) {
        // Can return string
        return "a=12;b="+args[1]
        // Can return 1 level deep record
        return {
            a: 12,
            b: args[1]
        }
    },
    // Build the body
    buildbody ( request, args ) {
        // Can return a string for rest by example
        return JSON.stringify( args[1] )
        // Can return form data for multipart
        // $myForm contains inputs and files
        return new FormData( $myForm )
        // Can return 1 level deep record
        return {
            a: 12,
            b: args[1]
        }
    },
    // Available response types
    responseType : "text" | "json" | "dom" | "blob",
    // Will filter the response given from the server
    filterResponse ( response, args ) {
        // If http is successful but server returned an unsuccessful content
        // Throw response so the fetch will go into error state
        if ( !response.success )
            throw response
        // Alter response
        delete remove.success
        remove.value = randomGlobalValue
        return resposne
    },
    filterError ( error, args ) {
        // Same but for the error
        // Cannot go back to a non error state (throw will do nothing)
        return error
    }
})

// ...
await myThunkFetcher('Arg1', 'Arg2')

```


##### TODO : Finish implementation
##### TODO : Finish doc
##### TODO : Make loader