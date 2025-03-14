import { expect } from "chai"
import { validate, Test } from "../exports.js"

const searchUser: Test = async(api) => {
	const response = await api.searchUser("Tae", 2)
	expect(response.total).to.be.greaterThan(20)
	expect(response.data).to.have.lengthOf(20)
	expect(validate(response.data, "User")).to.be.true
	return true
}

const searchWiki: Test = async(api) => {
	const response = await api.searchWiki("Beat", 2)
	expect(response.total).to.be.greaterThan(50)
	expect(response.data).to.have.lengthOf(50)
	expect(validate(response.data, "WikiPage")).to.be.true
	return true
}

export const tests = [
	searchUser,
	searchWiki,
]
