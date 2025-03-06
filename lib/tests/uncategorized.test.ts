import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getSeasonalBackgrounds = async(): Test => {
	const response = await api.getSeasonalBackgrounds()
	expect(response.ends_at).to.be.greaterThan(new Date("2025-01-01"))
	expect(response.backgrounds).to.have.length.greaterThan(0)
	return true
}

export const tests = [
	getSeasonalBackgrounds,
]

export async function testUncategorized(token: API["_access_token"]) {
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
