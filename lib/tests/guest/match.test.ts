import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getMatch: Test = async(api) => {
	console.log("|", "Without teams")
	const response_noteams = await api.getMatch(75706987, {limit: 15})
	expect(response_noteams.match.id).to.equal(75706987)
	expect(response_noteams.match.name).to.equal("KC: (Taevas) vs (Stipoki)")
	expect(response_noteams.current_game_id).to.be.null
	expect(response_noteams.events).to.have.lengthOf(15)
	response_noteams.events.forEach((e) => e.game?.scores.forEach((score) => expect(score.match.team).to.equal("none")))
	expect(validate(response_noteams, "Match")).to.be.true

	console.log("|", "With teams")
	const response_teams = await api.getMatch(118245933)
	expect(response_teams.match.id).to.equal(118245933)
	expect(response_teams.match.name).to.equal("ZCC2: (Suaaaaa) vs. (pwaczar)")
	expect(response_teams.current_game_id).to.be.null
	response_teams.events.forEach((e) => e.game?.scores.forEach((score) => expect(score.match.team).to.not.equal("none")))
	expect(validate(response_teams, "Match")).to.be.true

	return true
}

const getMatches: Test = async(api) => {
	const matches = await api.getMatches({limit: 10})
	expect(matches).to.have.lengthOf(10)
	matches.forEach((match) => expect(match.id).to.be.greaterThan(117498211))
	expect(validate(matches, "Match.Info")).to.be.true
	return true
}

export const tests = [
	getMatch,
	getMatches,
]
