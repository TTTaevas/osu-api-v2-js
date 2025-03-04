import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const searchUser = async(): Test => {
	const response = await api.searchUser("Tae", 2)
	expect(response.total).to.be.greaterThan(20)
	expect(response.data).to.have.lengthOf(20)
	expect(validate(response.data, "User"))
	return true
}

const searchWiki = async(): Test => {
	const response = await api.searchWiki("Beat", 2)
	expect(response.total).to.be.greaterThan(50)
	expect(response.data).to.have.lengthOf(50)
	expect(validate(response.data, "WikiPage"))
	return true
}

export const tests = [
	searchUser,
	searchWiki,
]

export async function testHome(token: API["_access_token"]) {
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
