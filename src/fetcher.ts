/**
 * TODO : Request
 * 	Fetch helpers
 * 	Form helpers
 */

/**
 * TODO : Should be cancellable !
 */
// class CancellablePromise <T> extends Promise<T> {
// 	cancel () {
//
// 	}
// }

// ----------------------------------------------------------------------------- STRUCT

type FetcherType = "text" | "json" | "dom" | "blob"

type FetcherParametersObject = Record<string|number, string|number|boolean>

type TErrorHandler <TArguments extends any[], TResponse extends any> =
	( error:Error, fetcherArguments:TArguments, resolve:(response:TResponse) => void, reject:(response:Error) => void) => any|void

type Fetch = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

interface FetcherOptions <TArguments extends any[], TResponse extends any> {
	// Request options
	base			?:string
	request			?:RequestInit
	buildURI		?:( request:RequestInit, fetcherArguments:TArguments) => string
	buildGet		?:( request:RequestInit, fetcherArguments:TArguments) => FetcherParametersObject|string
	buildBody		?:( request:RequestInit, fetcherArguments:TArguments) => FetcherParametersObject|FormData|string
	/**
	 * Response type, default is JSON
	 */
	responseType	?:FetcherType
	/**
	 * Filter response after response type decoding.
	 */
	filterResponse 	?:( response:TResponse, fetcherArguments:TArguments) => TResponse|Promise<TResponse>
	/**
	 * Check if a fetch response is ok. By default it returns response.ok
	 */
	isResponseOK	?:(response:Response) => boolean
	/**
	 * Custom error handler.
	 * If false, no error will be thrown and the fetcher will simply return null in case of error.
	 */
	errorHandler	?:( TErrorHandler<TArguments, TResponse> | false )
	/**
	 * Override fetch with a custom function
	 * useful for usage with node-fetch in a node env
	 */
	fetchFunction	?:Fetch
}

// ----------------------------------------------------------------------------- FETCHER ERROR

export class FetcherError extends Error {
	fetchResponse	:Response
}

function createFetchError ( message:string, fetchResponse:Response ) {
	const error = new FetcherError()
	error.message = message
	error.fetchResponse = fetchResponse
	return error
}

// ----------------------------------------------------------------------------- CREATE FETCHER

export function createFetcher
	<TArguments extends any[], TResponse extends any>
	( fetcherOptions:FetcherOptions<TArguments, TResponse> )
{
	// Return a thunk fetcher
	return ( ...rest:TArguments ):Promise<TResponse> => {
		// Custom or native fetch function
		const _F:Fetch = fetcherOptions.fetchFunction ?? fetch
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
			_F( uri, request )
			// Parse data type
			.then( async response => {
				// Check if fetch response is OK
				const isOK = (
					fetcherOptions.isResponseOK
					? fetcherOptions.isResponseOK( response )
					: response.ok
				)
				// Not OK, create and throw a fetcher error
				if ( !isOK )
					throw createFetchError("fetchError", response)
				// Transform to TEXT
				if ( fetcherOptions.responseType === "text" )
					return await response.text()
				// Transform to JSON
				else if ( !fetcherOptions.responseType || fetcherOptions.responseType === "json" )
					return await response.json()
				// Transform to DOM
				else if ( fetcherOptions.responseType === "dom" ) {
					const container = document.createElement('div')
					container.innerHTML = await response.text()
					return container.firstChild
				}
				// Transform to BLOB
				else if ( fetcherOptions.responseType === "blob" )
					return response.blob()
				// Invalid response type
				throw createFetchError("invalidResponseType", response)
			})
			// Parse and filter response
			.then( data => (
				fetcherOptions.filterResponse
				? fetcherOptions.filterResponse( data, rest )
				: data
			))
			// Finally, resolve and catch
			.then( resolve ).catch( ( error:Error ) => {
				// Shorthand : Never throw if errorHandler is set to false
				// We simply return null
				if ( fetcherOptions.errorHandler === false )
					resolve( null )
				// Error handler is not set
				// Reject directly
				else if ( !fetcherOptions.errorHandler )
					reject( error )
				// Pass through error handler
				// This function needs to call resolve or reject to resolve Promise
				else
					fetcherOptions.errorHandler( error, rest, resolve, reject )
			})
		})
	}
}
