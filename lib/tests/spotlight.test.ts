import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getSpotlights = async(): Test => {
	const spotlights = await api.getSpotlights()
	expect(spotlights).to.have.length.greaterThanOrEqual(132)
	expect(validate(spotlights, "Spotlight")).to.be.true
	return true
}

export const tests = [
	getSpotlights,
]

export async function testSpotlight(token: API["_access_token"]) {
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
