import { expect } from "chai"
import { Test } from "../exports.js"
import { API, APIError } from "../../index.js"

const timeout: Test = async(api) => {
	api.retry_on_timeout = false
	api.timeout = 0.1

	try {
		expect(await api.getUser(2)).to.be.false
	} catch(e) {
		expect(e).to.be.instanceof(APIError)
		if (e instanceof APIError) {
			expect(e.message).to.equal("TimeoutError (The operation was aborted due to timeout)")
			expect(e.original_error?.name).to.equal("TimeoutError")
			return true
		}
	}

	throw new Error("Timeout test failed, check logs for details")
}

const abort: Test = async(api) => {
	const controller = new AbortController()

	try {
		setTimeout(() => {controller.abort()}, 50)
		await new API({...api, signal: controller.signal, set_token_on_creation: false}).getUser(2)
	} catch(e) {
		expect(e).to.be.instanceof(APIError)
		if (e instanceof APIError) {
			expect(e.message).to.equal("AbortError (This operation was aborted)")
			expect(e.original_error?.name).to.equal("AbortError")
			return true
		}
	}

	throw new Error("Abort test failed, likely that the request was a success (even though it shouldn't have been one)")
}

const set_token_on_401: Test = async(api) => {
	api.set_token_on_401 = true
	await api.revokeToken()
	const responses = await Promise.all([api.getUser(2), api.getUser(3)])
	// The first request should trigger a token refresh, the second request should not (vice-versa would be fine too)
	// Both requests should be successful upon retrying

	expect(responses[0].id).to.equal(2)
	expect(responses[1].id).to.equal(3)
	return true
}

const set_token_on_expires: Test = async(api) => {
	api.revokeToken() // invalidate current token for safety purposes, no need to wait for it
	api.set_token_on_expires = true

	const seconds_delay = 1
	const date = new Date()
	date.setSeconds(date.getSeconds() + seconds_delay)
	api.expires = date
	await new Promise(resolve => setTimeout(resolve, (seconds_delay + 2) * 1000))

	const response = await api.getUser(2)
	expect(response.id).to.equal(2)
	return true
}

export const tests = [
	timeout,
	abort,
	set_token_on_401,
	set_token_on_expires,
]
