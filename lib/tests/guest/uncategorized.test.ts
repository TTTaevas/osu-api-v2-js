import { API } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getSeasonalBackgrounds: Test = async(api: API) => {
	const response = await api.getSeasonalBackgrounds()
	expect(response.ends_at).to.be.greaterThan(new Date("2025-01-01"))
	expect(response.backgrounds).to.have.length.greaterThan(0)
	return true
}

export const tests = [
	getSeasonalBackgrounds,
]