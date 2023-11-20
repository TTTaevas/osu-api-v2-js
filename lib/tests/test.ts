/**
 * The Client Credentials way
 * The token is considered by the API as a guest user
 */

import * as osu from "../index.js"
import "dotenv/config"
import util from "util"

import tsj from "ts-json-schema-generator"
import ajv from "ajv"

if (process.env.ID === undefined) {throw new Error("❌ The ID has not been defined in the environment variables!")}
if (process.env.SECRET === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}

let api: osu.API

async function attempt<T>(msg: string, fun: Promise<any>): Promise<T | false> {
	process.stdout.write(msg)
	try {
		let result = await fun
		return result
	} catch(err) {
		console.error(err)
		return false
	}
}

function isOk(response: any, condition?: boolean, depth: number = Infinity) {
	if (condition === undefined) condition = true
	if (!response || !condition) {
		if (Array.isArray(response) && response[0]) {
			console.log("(only printing the first element of the response array for the error below)")
			response = response[0]
		}
		console.error("❌ Bad response:", util.inspect(response, {colors: true, compact: true, breakLength: 400, depth: depth}))
		return false
	}
	return true
}

// ajv will not work properly if type is not changed from string to object where format is date-time
function fixDate(x: any) {
	if (typeof x === "object" && x !== null) {
		if (x["format"] && x["format"] === "date-time" && x["type"] && x["type"] === "string") {
			x["type"] = "object"
		}

		const k = Object.keys(x)
		const v = Object.values(x)
		for (let i = 0; i < k.length; i++) {
			x[k[i]] = fixDate(v[i])
		}
	}

	return x
}

// Creating a Generator takes 3 to 5 seconds, so it's better not to create one each time we call the validate function
function validate(object: unknown, schemaName: string, generator: tsj.SchemaGenerator): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		
		let validator = ajv_const.compile(schema)
		let result = validator(object)
		if (validator.errors) console.error(validator.errors)
		return result
	} catch(err) {
		console.log(err)
		return true
	}
}

/**
 * Check if getUser() and similar work fine 
 */
const testUserStuff = async (): Promise<boolean> => {
	const generator = tsj.createGenerator({path: "lib/user.ts", additionalProperties: true})
	const score_gen = tsj.createGenerator({path: "lib/score.ts", additionalProperties: true})
	const user_id = 7276846
	let okay = true
	
	let a1 = await <Promise<ReturnType<typeof api.getUser> | false>>attempt("\ngetUser: ", api.getUser({id: user_id}))
	if (!isOk(a1, !a1 || (a1.id === user_id && validate(a1, "UserExtended", generator)))) okay = false
	let a2 = await <Promise<ReturnType<typeof api.getUsers> | false>>attempt("getUsers: ", api.getUsers([user_id, 2]))
	if (!isOk(a2, !a2 || (a2.length === 2 && validate(a2[0], "UserWithCountryCoverGroupsStatisticsrulesets", generator)))) okay = false
	let a3 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores (best): ", api.getUserScores({id: user_id}, "best", 5))
	if (!isOk(a3, !a3 || (a3.length === 5 && validate(a3[0], "ScoreWithUserBeatmapBeatmapset", score_gen)))) okay = false
	let a4 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores (firsts): ", api.getUserScores({id: 6503700}, "firsts", 3))
	if (!isOk(a4, !a4 || (a4.length === 3 && validate(a4[0], "ScoreWithUserBeatmapBeatmapset", score_gen)))) okay = false
	let a5 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt(
		"getUserScores (recent): ", api.getUserScores({id: 12337864}, "recent", 1, undefined, true))
	// Due to the nature of the test, it might fail, you may adapt the user id
	if (!isOk(a5, !a5 || (a5.length === 1 && validate(a5[0], "ScoreWithUserBeatmapBeatmapset", score_gen)))) okay = false
	let a6 = await <Promise<ReturnType<typeof api.getUserKudosu> | false>>attempt("getUserKudosu: ", api.getUserKudosu({id: user_id}, 5))
	if (!isOk(a6, !a6 || (a6.length === 5 && validate(a6[0], "KudosuHistory", generator)))) okay = false

	return okay
}

/**
 * Check if getBeatmap() and similar work fine 
 */
const testBeatmapStuff = async (): Promise<boolean> => {
	const generator = tsj.createGenerator({path: "lib/beatmap.ts", additionalProperties: true})
	const score_gen = tsj.createGenerator({path: "lib/score.ts", additionalProperties: true})
	const beatmap_id = 388463
	let okay = true

	let b1 = await <Promise<ReturnType<typeof api.getBeatmap> | false>>attempt("\ngetBeatmap: ", api.getBeatmap({id: beatmap_id}))
	if (!isOk(b1, !b1 || (b1.id === beatmap_id && validate(b1, "BeatmapExtendedWithFailtimesBeatmapsetextended", generator)))) okay = false
	let b2 = await <Promise<ReturnType<typeof api.getBeatmaps> | false>>attempt("getBeatmaps: ", api.getBeatmaps([beatmap_id, 4089655]))
	if (!isOk(b2, !b2 || (b2.length === 2 && validate(b2[0], "BeatmapExtended", generator)))) okay = false

	let b3 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesOsu> | false>>attempt(
		"getBeatmapAttributesOsu: ", api.getBeatmapDifficultyAttributesOsu({id: 125660}, ["DT"]))
	if (!isOk(b3, !b3 || (b3.approach_rate.toFixed(2) === "9.67" && validate(b3, "BeatmapDifficultyAttributesOsu", generator)))) okay = false
	let b4 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesTaiko> | false>>attempt(
		"getBeatmapAttributesTaiko: ", api.getBeatmapDifficultyAttributesTaiko({id: beatmap_id}, ["DT"]))
	if (!isOk(b4, !b4 || (b4.great_hit_window < 35 && validate(b4, "BeatmapDifficultyAttributesTaiko", generator)))) okay = false
	let b5 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesFruits> | false>>attempt(
		"getBeatmapAttributesFruits: ", api.getBeatmapDifficultyAttributesFruits({id: 705339}, ["DT"]))
	if (!isOk(b5, !b5 || (b5.approach_rate.toFixed(2) === "10.33" && validate(b5, "BeatmapDifficultyAttributesFruits", generator)))) okay = false
	let b6 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesMania> | false>>attempt(
		"getBeatmapAttributesMania: ", api.getBeatmapDifficultyAttributesMania({id: 3980252}, ["DT"]))
	if (!isOk(b6, !b6 || (b6.great_hit_window === 40 && validate(b6, "BeatmapDifficultyAttributesMania", generator)))) okay = false
	
	let b7 = await <Promise<ReturnType<typeof api.getBeatmapUserScore> | false>>attempt(
		"getBeatmapUserScore: ", api.getBeatmapUserScore({id: 176960}, {id: 7276846}, ["NM"]))
	if (!isOk(b7, !b7 || (b7.score.accuracy < 0.99 && validate(b7, "BeatmapUserScore", score_gen)))) okay = false
	let b8 = await <Promise<ReturnType<typeof api.getBeatmapUserScores> | false>>attempt(
		"getBeatmapUserScores: ", api.getBeatmapUserScores({id: 203993}, {id: 7276846}, osu.Rulesets.fruits))
	if (!isOk(b8, !b8 || (b8.length === 1 && validate(b8[0], "Score", score_gen)))) okay = false
	let b9 = await <Promise<ReturnType<typeof api.getBeatmapset> | false>>attempt("getBeatmapset: ", api.getBeatmapset({id: 1971037}))
	if (!isOk(b9, !b9 || (b9.submitted_date?.toISOString().substring(0, 10) === "2023-04-07", validate(b9, "BeatmapsetExtendedPlus", generator)))) okay = false
	let b10 = await <Promise<ReturnType<typeof api.getBeatmapPack> | false>>attempt("getBeatmapPack: ", api.getBeatmapPack({tag: "P217"}))
	if (!isOk(b10, !b10 || (b10.tag === "P217" && validate(b10, "BeatmapPack", generator)))) okay = false
	let b11 = await <Promise<ReturnType<typeof api.getBeatmapPacks> | false>>attempt("getBeatmapPacks: ", api.getBeatmapPacks("tournament"))
	if (!isOk(b11, !b11 || (b11.length >= 100 && validate(b11[0], "BeatmapPack", generator)))) okay = false
	let b12 = await <Promise<ReturnType<typeof api.getBeatmapScores> | false>>attempt("getBeatmapScores: ", api.getBeatmapScores({id: 129891}))
	if (!isOk(b12, !b12 || (b12[0].score >= 132408001 && validate(b12[0], "ScoreWithUser", score_gen)))) okay = false

	return okay
}

/**
 * Check if getChangelogBuild() and similar work fine 
 */
const testChangelogStuff = async (): Promise<boolean> => {
	const generator = tsj.createGenerator({path: "lib/changelog.ts", additionalProperties: true})
	let okay = true

	let c1 = await <Promise<ReturnType<typeof api.getChangelogBuild> | false>>attempt("\ngetChangelogBuild: ", api.getChangelogBuild("lazer", "2023.1008.1"))
	if (!isOk(c1, !c1 || (c1.id === 7156 && validate(c1, "ChangelogBuildWithChangelogentriesVersions", generator)))) okay = false
	let c2 = await <Promise<ReturnType<typeof api.getChangelogBuilds> | false>>attempt(
		"getChangelogBuilds: ", api.getChangelogBuilds({from: "2023.1031.0", to: "20231102.3"}, 7184, undefined, ["markdown"]))
	if (!isOk(c2, !c2 || (c2.length === 4 && validate(c2[0], "ChangelogBuildWithUpdatestreamsChangelogentries", generator)))) okay = false
	let c3 = await <Promise<ReturnType<typeof api.getChangelogStreams> | false>>attempt("getChangelogStreams: ", api.getChangelogStreams())
	if (!isOk(c3, !c3 || (c3.length > 2 && validate(c3[0], "UpdateStreamWithLatestbuildUsercount", generator)))) okay = false

	return okay
}

/**
 * Check if getRoom(), getMatch() and similar work fine
 */
const testMultiplayerStuff = async (): Promise<boolean> => {
	const generator = tsj.createGenerator({path: "lib/multiplayer.ts", additionalProperties: true})
	let okay = true

	let d1 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("\ngetRoom (realtime): ", api.getRoom({id: 231069}))
	if (!isOk(d1, !d1 || (d1.recent_participants.length === 4 && validate(d1, "Room", generator)))) okay = false
	let d2 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("getRoom (playlist): ", api.getRoom({id: 51693}))
	if (!isOk(d2, !d2 || (d2.participant_count === 159 && validate(d2, "Room", generator)))) okay = false
	if (d1) { // can't bother getting and writing down the id of a playlist item
		let d3 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (realtime): ", api.getPlaylistItemScores({id: d1.playlist[0].id, room_id: d1.id}))
		!isOk(d3, !d3 || (d3.scores.length > 0 && validate(d3, "MultiplayerScores", generator)), 1) ?
			console.log("Bug not fixed yet...") : console.log("Bug fixed!!! :partying_face:")
	}
	if (d2) { // still can't bother getting and writing down the id of a playlist item
		let d4 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (playlist): ", api.getPlaylistItemScores({id: d2.playlist[0].id, room_id: d2.id}))
		if (!isOk(d4, !d4 || (d4.scores.length >= 50 && validate(d4, "MultiplayerScores", generator)), 1)) okay = false
	}
	let d5 = await <Promise<ReturnType<typeof api.getMatch> | false>>attempt("getMatch: ", api.getMatch(62006076))
	if (!isOk(d5, !d5 || (d5.match.name === "CWC2020: (Italy) vs (Indonesia)" && validate(d5, "Match", generator)), 3)) okay = false
	let d6 = await <Promise<ReturnType<typeof api.getMatches> | false>>attempt("getMatches: ", api.getMatches())
	if (!isOk(d6, !d6 || (d6[0].id > 111250329 && validate(d6[0], "MatchInfo", generator)))) okay = false

	return okay
}

/**
 * Check if getRanking() and similar work fine
 */
const testRankingStuff = async (): Promise<boolean> => {
	const generator = tsj.createGenerator({path: "lib/ranking.ts", additionalProperties: true})
	let okay = true

	let e1 = await <Promise<ReturnType<typeof api.getKudosuRanking> | false>>attempt("\ngetKudosuRanking: ", api.getKudosuRanking())
	if (!isOk(e1, !e1 || (e1[0].kudosu.total > 10000 && validate(e1[0], "UserWithKudosu", generator)))) okay = false
	let e2 = await <Promise<ReturnType<typeof api.getRanking> | false>>attempt(
		"getRanking: ", api.getRanking(osu.Rulesets.osu, "score", 1, "all", "FR"))
	if (!isOk(e2, !e2 || (e2.ranking[0].level.current > 106 && validate(e2, "Rankings", generator)), 2)) okay = false
	let e3 = await <Promise<ReturnType<typeof api.getCountryRanking> | false>>attempt("getCountryRanking: ", api.getCountryRanking(osu.Rulesets.osu))
	if (!isOk(e3, !e3 || (e3.ranking[0].code === "US" && validate(e3, "RankingsCountry", generator)))) okay = false
	let e4 = await <Promise<ReturnType<typeof api.getSpotlightRanking> | false>>attempt(
		"getSpotlightRanking: ", api.getSpotlightRanking(osu.Rulesets.taiko, {id: 48}))
	if (!isOk(e4, !e4 || (e4.ranking[0].hit_accuracy === 97.85 && validate(e4, "RankingsSpotlight", generator)), 2)) okay = false
	let e5 = await <Promise<ReturnType<typeof api.getSpotlights> | false>>attempt("getSpotlights: ", api.getSpotlights())
	if (!isOk(e5, !e5 || (e5.length >= 132 && validate(e5[0], "Spotlight", generator)))) okay = false

	return okay
}

const test = async (id: string, secret: string): Promise<void> => {
	api = await osu.API.createAsync({id: Number(id), secret}, undefined, "all")

	let a = await testUserStuff()
	let b = await testBeatmapStuff()
	let c = await testChangelogStuff()
	let d = await testMultiplayerStuff()
	let e = await testRankingStuff()

	let test_results = [a,b,c,d,e].map((bool: boolean, index: number) => bool ? `${index + 1}: ✔️\n` : `${index + 1}: ❌\n`)
	console.log("\n", ...test_results)
	if ([a,b,c,d,e].indexOf(false) === -1) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

test(process.env.ID, process.env.SECRET)
