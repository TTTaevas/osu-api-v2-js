import { expect } from "chai"
import { validate, Test } from "../exports.js"
import { Ruleset } from "../../index.js"

const getSpotlights: Test = async(api) => {
	const spotlights = await api.getSpotlights()
	expect(spotlights).to.have.length.greaterThanOrEqual(132)
	expect(validate(spotlights, "Spotlight")).to.be.true
	return true
}

const getSpotlightRanking: Test = async(api) => {
	const response = await api.getSpotlightRanking(Ruleset.taiko, 48)
	expect(response.beatmapsets).to.have.lengthOf(21)
	expect(response.ranking).to.have.length.greaterThan(0).and.lessThanOrEqual(40) // what if someone gets banned?
	expect(response.ranking.at(0)?.hit_accuracy).to.equal(97.85)
	expect(validate(response, "Spotlight.Ranking")).to.be.true
	return true
}

export const tests = [
	getSpotlights,
	getSpotlightRanking,
]
