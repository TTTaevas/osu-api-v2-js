import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getEvents: Test = async(api) => {
	const response = await api.getEvents()
	expect(response.cursor_string).to.be.a("string")
	expect(response.events).to.have.lengthOf(50)
	expect(validate(response.events, "Event.Any")).to.be.true
	return true
}

export const tests = [
	getEvents,
]
