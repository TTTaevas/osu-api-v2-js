import { Ruleset } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getUser: Test = async(api) => {
	const user = await api.getUser(7276846)
	expect(user.id).to.equal(7276846)
	expect(validate(user, "User.Extended")).to.be.true
	return true
}

const getUsers: Test = async(api) => {
	const users = await api.getUsers([7276846, 2])
	expect(users).to.have.lengthOf(2)
	expect(users.at(0)?.id).to.equal(2)
	expect(users.at(1)?.id).to.equal(7276846)
	expect(validate(users, "User.WithCountryCoverGroupsTeamStatisticsrulesets")).to.be.true
	return true
}

const lookupUsers: Test = async(api) => {
	const users = await api.lookupUsers([7276846, 2])
	expect(users).to.have.lengthOf(2)
	expect(users.at(0)?.id).to.equal(2)
	expect(users.at(1)?.id).to.equal(7276846)
	expect(validate(users, "User.WithCountryCoverGroupsTeam")).to.be.true
	return true
}

const getUserScores: Test = async(api) => {
	console.log("| best")
	const scores_best = await api.getUserScores(7276846, "best", undefined, {fails: false, lazer: true}, {limit: 5})
	expect(scores_best).to.have.lengthOf(5)
	expect(scores_best.at(0)?.pp).to.be.greaterThanOrEqual(scores_best.at(1)?.pp!)
	scores_best.forEach((score) => expect(score.user_id).to.equal(7276846))
	scores_best.forEach((score) => expect(score.user.id).to.equal(7276846))
	expect(validate(scores_best, "Score.WithUserBeatmapBeatmapset")).to.be.true

	console.log("| firsts")
	const scores_first = await api.getUserScores(6503700, "firsts", Ruleset.taiko, undefined, {limit: 3})
	expect(scores_first).to.have.lengthOf(3)
	expect(scores_first.at(0)?.ended_at).to.be.greaterThanOrEqual(scores_first.at(1)?.ended_at!)
	scores_first.forEach((score) => expect(score.user_id).to.equal(6503700))
	scores_first.forEach((score) => expect(score.user.id).to.equal(6503700))
	expect(validate(scores_first, "Score.WithUserBeatmapBeatmapset")).to.be.true

	console.log("| recent")
	const scores_recent = await api.getUserScores(2400918, "recent", undefined, {fails: false, lazer: true}, {limit: 2})
	expect(scores_recent).to.have.lengthOf(2)
	expect(scores_recent.at(0)?.ended_at).to.be.greaterThanOrEqual(scores_recent.at(1)?.ended_at!)
	scores_recent.forEach((score) => expect(score.user_id).to.equal(2400918))
	scores_recent.forEach((score) => expect(score.user.id).to.equal(2400918))
	expect(validate(scores_recent, "Score.WithUserBeatmapBeatmapset")).to.be.true

	return true
}

const getUserBeatmaps: Test = async(api) => {
	const beatmapsets = await api.getUserBeatmaps(7276846, "guest")
	expect(beatmapsets).to.have.length.greaterThanOrEqual(1)
	expect(beatmapsets.at(-1)?.id).to.equal(887302)
	expect(beatmapsets.at(-1)?.beatmaps).to.have.lengthOf(8)
	expect(beatmapsets.at(-1)?.beatmaps.find((beatmap) => beatmap.id === 1857760)).to.not.be.undefined
	expect(validate(beatmapsets, "Beatmapset.Extended.WithBeatmap")).to.be.true
	return true
}

const getUserMostPlayed: Test = async(api) => {
	const playcounts = await api.getUserMostPlayed(7276846)
	expect(playcounts).to.have.lengthOf(5)
	expect(playcounts.at(0)?.beatmap_id).to.equal(633993)
	expect(playcounts.at(0)?.beatmapset.id).to.equal(280107)
	expect(playcounts.at(0)?.beatmapset.title_unicode).to.equal("furioso melodia")
	playcounts.forEach((pc) => expect(pc.beatmap.id).to.equal(pc.beatmap_id))
	playcounts.forEach((pc) => expect(pc.beatmapset.id).to.equal(pc.beatmap.beatmapset_id))
	expect(validate(playcounts, "Beatmap.Playcount")).to.be.true
	return true
}

const getUserRecentActivity: Test = async(api) => {
	const events = await api.getUserRecentActivity(7562902, {limit: 25})
	expect(events).to.have.lengthOf(25)
	expect(validate(events, "Event.AnyRecentActivity")).to.be.true
	return true
}

const getUserKudosu: Test = async(api) => {
	const events = await api.getUserKudosu(7276846, {limit: 5})
	expect(events).to.have.lengthOf(5)
	expect(validate(events, "User.KudosuHistory")).to.be.true
	return true
}

export const tests = [
	getUser,
	getUsers,
	lookupUsers,
	getUserScores,
	getUserBeatmaps,
	getUserMostPlayed,
	getUserRecentActivity,
	getUserKudosu,
]
