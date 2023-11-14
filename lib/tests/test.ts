/**
 * The Client Credentials way
 * The token is considered by the API as a guest user
 */

import * as osu from "../index.js"
import "dotenv/config"
import util from "util"
// console.log(util.inspect(users, false, null, true))

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

function isOk(response: any, condition?: boolean) {
	if (condition === undefined) condition = true
	if (!response || !condition) {
		console.error("❌ Bad response:", response)
		return false
	}
	return true
}

/**
 * Check if getUser() and similar work fine 
 */
const testUserStuff = async (): Promise<boolean> => {
	const user_id = 7276846
	let okay = true

	let a1 = await <Promise<ReturnType<typeof api.getUser> | false>>attempt("\ngetUser: ", api.getUser({id: user_id}))
	if (!isOk(a1, !a1 || (a1.id === user_id))) okay = false
	let a2 = await <Promise<ReturnType<typeof api.getUsers> | false>>attempt("getUsers: ", api.getUsers([user_id, 2]))
	if (!isOk(a2, !a2 || (a2.length === 2))) okay = false
	let a3 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores: ", api.getUserScores({id: user_id}, "best", 5))
	if (!isOk(a3, !a3 || (a3.length === 5))) okay = false
	let a4 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores: ", api.getUserScores({id: user_id}, "firsts", 5))
	if (!isOk(a4, !a4 || (a4.length === 0))) okay = false
	let a5 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores: ", api.getUserScores({id: user_id}, "recent", 5))
	if (!isOk(a5)) okay = false
	let a6 = await <Promise<ReturnType<typeof api.getUserKudosu> | false>>attempt("getUserKudosu: ", api.getUserKudosu({id: user_id}, 5))
	if (!isOk(a6, !a6 || (a6.length === 5))) okay = false

	return okay
}

/**
 * Check if getBeatmap() and similar work fine 
 */
const testBeatmapStuff = async (): Promise<boolean> => {
	const beatmap_id = 388463
	let okay = true

	let b1 = await <Promise<ReturnType<typeof api.getBeatmap> | false>>attempt("\ngetBeatmap: ", api.getBeatmap({id: beatmap_id}))
	if (!isOk(b1, !b1 || (b1.id === beatmap_id))) okay = false
	let b2 = await <Promise<ReturnType<typeof api.getBeatmaps> | false>>attempt("getBeatmaps: ", api.getBeatmaps([beatmap_id, 4089655]))
	if (!isOk(b2, !b2 || (b2.length === 2))) okay = false
	let b3 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributes> | false>>attempt(
		"getBeatmapAttributes: ", api.getBeatmapDifficultyAttributes({id: beatmap_id}, ["DT"]))
	if (!isOk(b3, !b3 || (b3.great_hit_window < 35))) okay = false
	let b4 = await <Promise<ReturnType<typeof api.getBeatmapUserScore> | false>>attempt(
		"getBeatmapUserScore: ", api.getBeatmapUserScore({id: 176960}, {id: 7276846}, ["NM"]))
	if (!isOk(b4, !b4 || (b4.score.accuracy < 0.99))) okay = false
	let b5 = await <Promise<ReturnType<typeof api.getBeatmapUserScores> | false>>attempt(
		"getBeatmapUserScores: ", api.getBeatmapUserScores({id: 203993}, {id: 7276846}, osu.Rulesets.fruits))
	if (!isOk(b5, !b5 || (b5.length === 1))) okay = false
	let b6 = await <Promise<ReturnType<typeof api.getBeatmapset> | false>>attempt("getBeatmapset", api.getBeatmapset({id: 1971037}))
	if (!isOk(b6, !b6 || (b6.submitted_date?.toISOString().substring(0, 10) === "2023-04-07"))) okay = false
	let b7 = await <Promise<ReturnType<typeof api.getBeatmapPack> | false>>attempt("getBeatmapPack", api.getBeatmapPack({tag: "P217"}))
	if (!isOk(b7, !b7 || (b7.tag === "P217"))) okay = false
	let b8 = await <Promise<ReturnType<typeof api.getBeatmapPacks> | false>>attempt("getBeatmapPacks", api.getBeatmapPacks("tournament"))
	if (!isOk(b8, !b8 || (b8.length >= 100))) okay = false

	return okay
}

/**
 * Check if getChangelogBuild() and similar work fine 
 */
const testChangelogStuff = async (): Promise<boolean> => {
	let okay = true

	let c1 = await <Promise<ReturnType<typeof api.getChangelogBuild> | false>>attempt("\ngetChangelogBuild: ", api.getChangelogBuild("lazer", "2023.1008.1"))
	if (!isOk(c1, !c1 || (c1.id === 7156))) okay = false
	let c2 = await <Promise<ReturnType<typeof api.getChangelogBuilds> | false>>attempt(
		"getChangelogBuilds: ", api.getChangelogBuilds({from: "2023.1031.0", to: "20231102.3"}, 7184, undefined, ["markdown"]))
	if (!isOk(c2, !c2 || (c2.length === 4))) okay = false
	let c3 = await <Promise<ReturnType<typeof api.getChangelogStreams> | false>>attempt("getChangelogStreams: ", api.getChangelogStreams())
	if (!isOk(c3, !c3 || (c3.length > 2))) okay = false

	return okay
}

/**
 * Check if getRoom(), getMatch() and similar work fine
 */
const testMultiplayerStuff = async (): Promise<boolean> => {
	let okay = true

	let d1 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("\ngetRoom (realtime): ", api.getRoom({id: 231069}))
	if (!isOk(d1, !d1 || (d1.recent_participants.length === 4))) okay = false
	let d2 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("getRoom (playlist): ", api.getRoom({id: 51693}))
	if (!isOk(d2, !d2 || (d2.participant_count === 159))) okay = false
	if (d1) { // can't bother getting and writing down the id of a playlist item
		let d3 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (realtime): ", api.getPlaylistItemScores({id: d1.playlist[0].id, room_id: d1.id}))
		!isOk(d3, !d3 || (d3.length > 0)) ? console.log("Bug not fixed yet...") : console.log("Bug fixed!!! :partying_face:")
	}
	if (d2) { // still can't bother getting and writing down the id of a playlist item
		let d4 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (playlist): ", api.getPlaylistItemScores({id: d2.playlist[0].id, room_id: d2.id}))
		if (!isOk(d4, !d4 || (d4.length >= 50))) okay = false
	}
	let d5 = await <Promise<ReturnType<typeof api.getMatch> | false>>attempt("getMatch: ", api.getMatch(62006076))
	if (!isOk(d5, !d5 || (d5.match.name === "CWC2020: (Italy) vs (Indonesia)"))) okay = false
	let d6 = await <Promise<ReturnType<typeof api.getMatches> | false>>attempt("getMatches: ", api.getMatches())
	if (!isOk(d6, !d6 || (d6[0].id > 111250329))) okay = false

	return okay
}

/**
 * Check if getRanking() and similar work fine
 */
const testRankingStuff = async (): Promise<boolean> => {
	let okay = true

	let e1 = await <Promise<ReturnType<typeof api.getKudosuRanking> | false>>attempt("\ngetKudosuRanking: ", api.getKudosuRanking())
	if (!isOk(e1, !e1 || (e1[0].kudosu!.total > 10000))) okay = false
	let e2 = await <Promise<ReturnType<typeof api.getRanking> | false>>attempt(
		"getRanking: ", api.getRanking(osu.Rulesets.osu, "score", 1, "all", "FR"))
	if (!isOk(e2, !e2 || (e2.ranking[0].level.current > 106))) okay = false
	let e3 = await <Promise<ReturnType<typeof api.getCountryRanking> | false>>attempt("getCountryRanking: ", api.getCountryRanking(osu.Rulesets.osu))
	if (!isOk(e3, !e3 || (e3.ranking[0].code === "US"))) okay = false
	let e4 = await <Promise<ReturnType<typeof api.getSpotlightRanking> | false>>attempt(
		"getSpotlightRanking: ", api.getSpotlightRanking(osu.Rulesets.taiko, {id: 48}))
	if (!isOk(e4, !e4 || (e4.ranking[0].hit_accuracy === 97.85))) okay = false
	let e5 = await <Promise<ReturnType<typeof api.getSpotlights> | false>>attempt("getSpotlights: ", api.getSpotlights())
	if (!isOk(e5, !e5 || (e5.length >= 132))) okay = false

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
