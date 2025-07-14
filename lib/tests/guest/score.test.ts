import { expect } from "chai"
import { validate, Test } from "../exports.js"
import { Ruleset, Score } from "../../index.js"

let all_scores: Score[] = []

const getScores: Test = async(api) => {
	const scores = await api.getScores()
	expect(scores.cursor_string).to.be.a("string")
	expect(scores.scores).to.have.length.greaterThan(0)
	expect(validate(scores.scores, "Score")).to.be.true

	console.log("|", "With cursor_string")
	const scores_cursor = await api.getScores({cursor_string: scores.cursor_string})
	expect(scores_cursor.cursor_string).to.be.a("string")
	if (scores_cursor.scores.length === 0) console.log("| ⚠️ Empty array of scores, not throwing but unable to validate")
	expect(validate(scores_cursor.scores, "Score")).to.be.true

	console.log("|", "With ruleset")
	const scores_ruleset = await api.getScores({ruleset: "fruits"})
	expect(scores_ruleset.cursor_string).to.be.a("string")
	expect(scores_ruleset.scores).to.have.length.greaterThan(0)
	scores_ruleset.scores.forEach((s) => expect(s.ruleset_id).to.equal(Ruleset.fruits))
	expect(validate(scores_ruleset.scores, "Score")).to.be.true

	all_scores = scores.scores
	return true
}

const getScore: Test = async(api) => {
	const score_id = all_scores.length ? all_scores[Math.floor(Math.random() * all_scores.length)].id : 4892985569
	if (all_scores.length === 0) console.log("| ⚠️ No score gotten from previous test, using an old score instead")
	const score = await api.getScore(score_id)

	expect(score.id).to.equal(score_id)
	expect(validate(score, "Score.Extended")).to.be.true
	return true
}

export const tests = [
	getScores,
	getScore
]
