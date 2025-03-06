import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getWikiPage = async(): Test => {
	const page = await api.getWikiPage("Rules")
	expect(page.title).to.equal("Rules")
	expect(validate(page, "WikiPage")).to.be.true
	return true
}

export const tests = [
	getWikiPage,
]

export async function testWiki(token: API["_access_token"]) {
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
