import { expect } from "chai"
import { Test } from "../exports.js"
import { APIError } from "../../index.js"

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
		expect(await api.withSettings({signal: controller.signal}).getUser(2)).to.be.false
	} catch(e) {
		expect(e).to.be.instanceof(APIError)
		if (e instanceof APIError) {
			expect(e.message).to.equal("AbortError (This operation was aborted)")
			expect(e.original_error?.name).to.equal("AbortError")
			return true
		}
	}

	throw new Error("Abort test failed, check logs for details")
}

const refresh_on_401: Test = async(api) => {
	api.refresh_token_on_401 = true
	await api.revokeToken()
	const response = await api.getUser(2)
	expect(response.id).to.equal(2)
	return true
}

const refresh_on_expires: Test = async(api) => {
	api.revokeToken() // invalidate current token for safety purposes, no need to wait for it
	api.refresh_token_on_expires = true

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
	refresh_on_401,
	refresh_on_expires,
]
