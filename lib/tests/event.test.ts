import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getEvents = async(): Test => {
	const response = await api.getEvents()
	expect(response.cursor_string).to.be.a("string")
	expect(response.events).to.have.lengthOf(50)
	expect(validate(response.events, "Event.Any"))
	return true
}

export const tests = [
	getEvents,
]

export async function testEvent(token: API["_access_token"]) {
	api.access_token = token
	for (let i = 0; i < tests.length; i++) {
		try {
			console.log(tests[i].name)
			await tests[i]()
		} catch(e) {
			console.error(e)
			return false
		}
	}
	return true
}
