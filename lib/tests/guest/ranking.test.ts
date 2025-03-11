import { Ruleset } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getUserRanking: Test = async(api) => {
	const types: ["performance", "score"] = ["performance", "score"]
	for (let i = 0; i < types.length; i++) {
		console.log("|", types[i])
		const response = await api.getUserRanking(Ruleset.osu, types[i], {country: "FR"})
		expect(response.total).to.equal(10000)
		expect(response.ranking).to.have.lengthOf(50)
		expect(response.cursor.page).to.equal(2)
		expect(response.ranking.at(0)?.play_count).to.be.greaterThan(100000)
		expect(validate(response, "Ranking.User")).to.be.true
	}
	return true
}

const getCountryRanking: Test = async(api) => {
	const response = await api.getCountryRanking(Ruleset.osu)
	expect(response.total).to.be.greaterThan(200).and.lessThan(500)
	expect(response.ranking).to.have.lengthOf(50)
	expect(response.cursor.page).to.equal(2)
	expect(response.ranking.at(0)?.code).to.equal("US")
	expect(validate(response, "Ranking.Country")).to.be.true
	return true
}

const getKudosuRanking: Test = async(api) => {
	const users = await api.getKudosuRanking()
	expect(users).to.have.lengthOf(50)
	expect(users.at(0)?.kudosu.total).to.be.greaterThan(10000)
	expect(validate(users, "User.WithKudosu")).to.be.true
	return true
}

const getSpotlightRanking: Test = async(api) => {
	const response = await api.getSpotlightRanking(Ruleset.taiko, 48)
	expect(response.beatmapsets).to.have.lengthOf(21)
	expect(response.ranking).to.have.length.greaterThan(0).and.lessThanOrEqual(40) // what if someone gets banned?
	expect(response.ranking.at(0)?.hit_accuracy).to.equal(97.85)
	expect(validate(response, "Ranking.Spotlight")).to.be.true
	return true
}

export const tests = [
	getUserRanking,
	getCountryRanking,
	getKudosuRanking,
	getSpotlightRanking,
]
