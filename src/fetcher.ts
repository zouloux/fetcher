/**
 * TODO : Request
 * 	Fetch helpers
 * 	Form helpers
 */

/**
 * - create basic fetcher
 * const fetcherExample = createFetcher({
 *     base: base + '/api/',
 * })
 *
 *
 * await userFetcher('get-current-user')
 */

/**
 * Types de fetcher
 * - text
 * - json
 * - dom
 * - blob (img / audio)
 */

/**
 * TODO : Should be cancellable !
 */


// class CancellablePromise <T> extends Promise<T> {
// 	cancel () {
//
// 	}
// }



type FetcherType = "text" | "json" | "dom" | "blob"

type FetcherParametersObject = Record<string|number, string|number|boolean>

interface FetcherOptions <TArguments extends any[], TResponse extends any> {
	// Request
	base			?:string
	request			?:RequestInit
	buildURI		?:( request:RequestInit, fetcherArguments:TArguments) => string
	buildGet		?:( request:RequestInit, fetcherArguments:TArguments) => FetcherParametersObject|string
	buildBody		?:( request:RequestInit, fetcherArguments:TArguments) => FetcherParametersObject|FormData|string
	// Response
	responseType	?:FetcherType
	// FIXME : Can throw if response.error or !response.success
	filterResponse 	?:( response:TResponse, fetcherArguments:TArguments) => TResponse
	filterError		?:( response:TResponse, fetcherArguments:TArguments) => TResponse
}

export function createFetcher
	<TArguments extends any[], TResponse extends any>
	( fetcherOptions:FetcherOptions<TArguments, TResponse> )
{
	// Return a thunk fetcher
	return ( ...rest:TArguments ) => {
		// Create request init object from default request in fetcher options
		const request:RequestInit = { ...fetcherOptions.request }
		// Build uri
		let uri = fetcherOptions.base ?? ''
		if ( fetcherOptions.buildURI )
			uri += fetcherOptions.buildURI( request, rest )
		// Build get parameters
		if ( fetcherOptions.buildGet ) {
			let getParameters = fetcherOptions.buildGet( request, rest )
			// If this is an object pass through URLSearchParams to convert to string
			if ( typeof getParameters === "object" )
				getParameters = new URLSearchParams( getParameters as Record<string, string> ).toString()
			// Prepend with ?
			uri += '?' + getParameters
		}
		// Build body
		if ( fetcherOptions.buildBody ) {
			const body = fetcherOptions.buildBody( request, rest )
			// This is already a string some JSON.stringify by ex
			if ( typeof body === "string" )
				request.body = body
			else if ( typeof body === "object" ) {
				// Already a form data
				if ( body instanceof FormData )
					request.body = body
				// Arbitrary object, convert to form data
				else {
					const formData = new FormData()
					for ( let i in body )
						if ( body.hasOwnProperty(i) )
							// convert to string
							formData.append( i, '' + body[i] )
					request.body = formData
				}
			}
		}
		// We can now execute the fetch and return the associated promise
		return new Promise<TResponse>( (resolve, reject) => {
			// Execute request
			fetch( uri, request )
			// Parse data type
			.then( async data => {
				if ( fetcherOptions.responseType === "text" )
					return await data.text()
				else if ( fetcherOptions.responseType === "json" )
					return await data.json()
				else if ( fetcherOptions.responseType === "dom" ) {
					const container = document.createElement('div')
					container.innerHTML = await data.text()
					return container.firstChild
				}
				else if ( fetcherOptions.responseType === "blob" )
					return data.blob()
			})
			// Parse and filter response
			.then( data => {
				// Filter response
				if ( fetcherOptions.filterResponse ) {
					try {
						data = fetcherOptions.filterResponse( data, rest )
					}
					catch ( error ) {
						reject( error )
						return
					}
				}
				resolve( data )
			})
			// Catch errors
			.catch( data => {
				if ( fetcherOptions.filterError )
					data = fetcherOptions.filterError( data, rest )
				resolve( data )
			})
		})
	}
}

// -----------------------------------------------------------------------------
/*

interface IUser {
	id:number
	name:string
}
type RestFetcher = {
	args: ['get-user', { id:number }],
	response: IUser
} | {
	args: [`get-user/${number}`],
	response: IUser
}

const restFetcher = createFetcher<RestFetcher["args"], RestFetcher["response"]>({
	base: '/api/1.0/',
	buildURI ( request, args ) {
		return args[0] + '/' + args[1].id
	},
	buildBody ( request, args ) {
		return args[1]
	}
})

const result1 = await restFetcher('get-user', { id: 12 })

const result2 = await restFetcher('get-user/12')





interface RestFetcherOptions<TArguments extends any[], TResponse extends any> extends FetcherOptions<TArguments, TResponse> {
	// TODO : minus type
	// TODO : Minus buildBody
	// TODO : Minus buildGet
}

export function createRestFetcher
	<TArguments extends any[], TResponse extends any>
	( fetcherOptions:RestFetcherOptions<TArguments, TResponse>, fetchOptions:RequestInit )
{
	// TODO : Configure with send post as json, receive as json
}
*/

/*
export function createJSONFetcher
	<TArguments extends any[], TResponse extends any>
	( baseOptions:JSONFetcherOptions<TArguments>,  ) {
	return ( ...rest:TArguments ) => {

		return new Promise<TResponse>( (resolve, reject) => {
			fetch( basePath + path, {
				cache
			})
			.then( d => d?.json?.() )
			.then( d => resolve( d ) )
			.catch( reject )
		})
	}
}*/
