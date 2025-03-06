import { API } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getWikiPage: Test = async(api: API) => {
	const page = await api.getWikiPage("Rules")
	expect(page.title).to.equal("Rules")
	expect(validate(page, "WikiPage")).to.be.true
	return true
}

export const tests = [
	getWikiPage,
]
