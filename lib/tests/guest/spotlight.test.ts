import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getSpotlights: Test = async(api) => {
	const spotlights = await api.getSpotlights()
	expect(spotlights).to.have.length.greaterThanOrEqual(132)
	expect(validate(spotlights, "Spotlight")).to.be.true
	return true
}

export const tests = [
	getSpotlights,
]
