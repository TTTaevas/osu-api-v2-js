import { Ruleset } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const lookupBeatmap: Test = async(api) => {
	const beatmap = await api.lookupBeatmap({id: 388463})
	expect(beatmap.id).to.equal(388463)
	expect(beatmap.beatmapset.title_unicode).to.equal("夜啼く兎は夢を見る")
	expect(validate(beatmap, "Beatmap.Extended.WithFailtimesOwnersBeatmapset")).to.be.true
	return true
}

const getBeatmap: Test = async(api) => {
	const beatmap = await api.getBeatmap(388463)
	expect(beatmap.id).to.equal(388463)
	expect(beatmap.beatmapset.title_unicode).to.equal("夜啼く兎は夢を見る")
	expect(validate(beatmap, "Beatmap.Extended.WithFailtimesOwnersBeatmapset")).to.be.true
	return true
}

const getBeatmaps: Test = async(api) => {
	const ids = [388463, 4089655]
	const beatmaps = await api.getBeatmaps(ids)
	ids.forEach((id, index) => expect(beatmaps[index].id).to.equal(id))
	expect(validate(beatmaps, "Beatmap.Extended.WithFailtimesOwnersMaxcombo")).to.be.true
	return true
}

const getBeatmapDifficultyAttributesOsu: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesOsu(125660, ["DT"])
	console.log(attributes)
	expect(attributes.approach_rate.toFixed(2)).to.equal("9.67")
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Osu"))
	return true
}

const getBeatmapDifficultyAttributesTaiko: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesTaiko(388463, ["DT"])
	expect(attributes.great_hit_window).to.be.lessThan(35)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Taiko"))
	return true
}

const getBeatmapDifficultyAttributesFruits: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesFruits(705339, ["DT"])
	expect(attributes.approach_rate.toFixed(2)).to.equal("10.33")
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Fruits"))
	return true
}

const getBeatmapDifficultyAttributesMania: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesMania(3980252, ["DT"])
	expect(attributes.great_hit_window).to.equal(40)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Mania"))
	return true
}

const getBeatmapScores: Test = async(api) => {
	const scores = await api.getBeatmapScores(129891, {legacy_only: true})
	scores.forEach((score) => expect(score.beatmap_id).to.equal(129891))
	expect(scores.at(0)?.legacy_total_score).to.equal(132408001)
	expect(validate(scores, "Score.WithUser"))
	return true
}

const getBeatmapSoloScores: Test = async(api) => {
	const scores = await api.getBeatmapSoloScores(129891)
	scores.forEach((score) => expect(score.beatmap_id).to.equal(129891))
	expect(scores.at(0)?.total_score).to.be.greaterThanOrEqual(1073231)
	expect(validate(scores, "Score.WithUser"))
	return true
}

const getBeatmapUserScore: Test = async(api) => {
	const score = await api.getBeatmapUserScore(176960, 7276846, {mods: ["NM"]})
	expect(score.position).to.be.a("number")
	expect(score.score.accuracy).to.be.lessThanOrEqual(0.99)
	expect(validate(score.score, "Score.WithUserBeatmap"))
	return true
}

const getBeatmapUserScores: Test = async(api) => {
	const scores = await api.getBeatmapUserScores(203993, 7276846, {ruleset: Ruleset.fruits})
	expect(scores).to.have.lengthOf(1)
	expect(validate(scores, "Score"))
	return true
}

const getBeatmapPack: Test = async(api) => {
	const pack = await api.getBeatmapPack("P217")
	expect(pack.tag).to.equal("P217")
	expect(validate(pack, "Beatmap.Pack.WithBeatmapset")).to.be.true
	return true
}

const getBeatmapPacks: Test = async(api) => {
	const packs = await api.getBeatmapPacks("tournament")
	expect(packs.beatmap_packs).to.have.lengthOf(100)
	expect(packs.cursor_string).to.be.a("string")
	expect(validate(packs.beatmap_packs, "Beatmap.Pack")).to.be.true
	return true
}

export const tests = [
	lookupBeatmap,
	getBeatmap,
	getBeatmaps,
	getBeatmapDifficultyAttributesOsu,
	getBeatmapDifficultyAttributesTaiko,
	getBeatmapDifficultyAttributesFruits,
	getBeatmapDifficultyAttributesMania,
	getBeatmapScores,
	getBeatmapSoloScores,
	getBeatmapUserScore,
	getBeatmapUserScores,
	getBeatmapPack,
	getBeatmapPacks,
]
