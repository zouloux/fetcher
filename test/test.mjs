import { createFetcher } from "../dist/fetcher.es2022.mjs"
import { test } from "@zouloux/cli"

test("fetch", it => {
	it("Should be a thunk", async assert => {
		const fetcher = createFetcher({})
		assert( typeof fetcher === "function" )
	})
	// it("Should get", async assert => {
	// 	const r = 1
	// 	assert( r === 1 )
	// })
})