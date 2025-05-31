import { expect } from "chai"
import { validate, Test } from "../exports.js"
import { Ruleset } from "../../index.js"

const getScores: Test = async(api) => {
	const scores = await api.getScores()
	expect(scores.cursor_string).to.be.a("string")
	expect(scores.scores.length).to.be.greaterThan(0)
	expect(validate(scores.scores, "Score")).to.be.true

	console.log("|", "With cursor_string")
	const scores_cursor = await api.getScores({cursor_string: scores.cursor_string})
	expect(scores_cursor.cursor_string).to.be.a("string")
	expect(scores_cursor.scores.length).to.be.greaterThan(0)
	expect(validate(scores_cursor.scores, "Score")).to.be.true

	console.log("|", "With ruleset")
	const scores_ruleset = await api.getScores({ruleset: "fruits"})
	expect(scores_ruleset.cursor_string).to.be.a("string")
	expect(scores_ruleset.scores.length).to.be.greaterThan(0)
	scores_ruleset.scores.forEach((s) => expect(s.ruleset_id).to.equal(Ruleset.fruits))
	expect(validate(scores_ruleset.scores, "Score")).to.be.true

	return true
}

export const tests = [
	getScores,
]
