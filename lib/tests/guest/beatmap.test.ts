import { Ruleset } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const lookupBeatmap: Test = async(api) => {
	const beatmap = await api.lookupBeatmap({id: 388463})
	expect(beatmap.id).to.equal(388463)
	expect(beatmap.beatmapset.title_unicode).to.equal("夜啼く兎は夢を見る")
	expect(validate(beatmap, "Beatmap.Extended.WithFailtimesOwnersMaxcomboBeatmapset")).to.be.true
	return true
}

const getBeatmap: Test = async(api) => {
	const beatmap = await api.getBeatmap(178645)
	expect(beatmap.id).to.equal(178645)
	expect(beatmap.beatmapset.title_unicode).to.equal("夜啼く兎は夢を見る")
	expect(validate(beatmap, "Beatmap.Extended.WithFailtimesOwnersMaxcomboBeatmapset")).to.be.true
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
	expect(attributes.max_combo).to.equal(1193)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Osu")).to.be.true
	return true
}

const getBeatmapDifficultyAttributesTaiko: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesTaiko(388463, ["DT"])
	expect(attributes.max_combo).to.equal(876)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Taiko")).to.be.true
	return true
}

const getBeatmapDifficultyAttributesFruits: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesFruits(705339, ["DT"])
	expect(attributes.max_combo).to.equal(1029)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Fruits")).to.be.true
	return true
}

const getBeatmapDifficultyAttributesMania: Test = async(api) => {
	const attributes = await api.getBeatmapDifficultyAttributesMania(473228, ["DT"])
	expect(attributes.max_combo).to.equal(5614)
	expect(validate(attributes, "Beatmap.DifficultyAttributes.Mania")).to.be.true
	return true
}

const getBeatmapScores: Test = async(api) => {
	const scores = await api.getBeatmapScores(129891, {legacy_only: true, mods: ["NM"]})
	expect(scores).to.have.lengthOf(50)
	scores.forEach((score) => expect(score.beatmap_id).to.equal(129891))
	scores.forEach((score) => expect(score.mods.find((mod) => mod.acronym === "CL")).to.not.be.undefined)
	scores.forEach((score) => expect(score.mods).to.have.lengthOf(1))
	expect(validate(scores, "Score.WithUser")).to.be.true
	return true
}

const getBeatmapUserScore: Test = async(api) => {
	const score = await api.getBeatmapUserScore(176960, 7276846, {mods: ["NM"]})
	expect(score.position).to.be.a("number")
	expect(score.score.accuracy).to.be.lessThanOrEqual(0.99)
	expect(validate(score.score, "Score.WithUserBeatmap")).to.be.true
	return true
}

const getBeatmapUserScores: Test = async(api) => {
	const scores = await api.getBeatmapUserScores(203993, 7276846, {ruleset: Ruleset.fruits})
	expect(scores).to.have.lengthOf(1)
	expect(validate(scores, "Score")).to.be.true
	return true
}

const getBeatmapUserTags: Test = async(api) => {
	const tags = await api.getBeatmapUserTags()
	expect(tags).to.have.length.greaterThan(60)
	expect(validate(tags, "Beatmap.UserTag")).to.be.true
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
	getBeatmapUserScore,
	getBeatmapUserScores,
	getBeatmapUserTags,
	getBeatmapPack,
	getBeatmapPacks,
]
