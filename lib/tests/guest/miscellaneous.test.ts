import { expect } from "chai"
import { Test, validate } from "../exports.js"
import { Ruleset } from "../../index.js"

const getCountryRanking: Test = async(api) => {
	const response = await api.getCountryRanking(Ruleset.osu)
	expect(response.total).to.be.greaterThan(200).and.lessThan(500)
	expect(response.ranking).to.have.lengthOf(50)
	expect(response.cursor.page).to.equal(2)
	expect(response.ranking.at(0)?.code).to.equal("US")
	expect(validate(response, "Miscellaneous.Country.Ranking")).to.be.true
	return true
}

const getSeasonalBackgrounds: Test = async(api) => {
	const response = await api.getSeasonalBackgrounds()
	expect(response.ends_at).to.be.greaterThan(new Date("2025-01-01"))
	expect(response.backgrounds).to.have.length.greaterThan(0)
	expect(response.backgrounds[0].url).to.be.a("string")
	expect(validate(response.backgrounds[0].user, "User")).to.be.true
	return true
}

export const tests = [
	getCountryRanking,
	getSeasonalBackgrounds,
]