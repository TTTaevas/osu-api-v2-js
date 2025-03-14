import { expect } from "chai"
import { Test } from "../exports.js"

const getSeasonalBackgrounds: Test = async(api) => {
	const response = await api.getSeasonalBackgrounds()
	expect(response.ends_at).to.be.greaterThan(new Date("2025-01-01"))
	expect(response.backgrounds).to.have.length.greaterThan(0)
	return true
}

export const tests = [
	getSeasonalBackgrounds,
]