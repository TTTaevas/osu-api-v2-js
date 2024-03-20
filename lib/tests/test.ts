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
const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true})

async function attempt<T extends (...args: any[]) => any>(fun: T, ...args: Parameters<T>): Promise<ReturnType<T> | false> {
	process.stdout.write(fun.name + ": ")
	try {
		const result = await fun.call(api, ...args)
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

function validate(object: unknown, schemaName: string): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		const validator = ajv_const.compile(schema)

		if (Array.isArray(object)) {
			for (let i = 0; i < object.length; i++) {
				const result = validator(object[i])
				if (validator.errors) console.error(validator.errors)
				if (!result) return false
			}
			return true
		} else {
			const result = validator(object)
			if (validator.errors) console.error(validator.errors)
			return result
		}
	} catch(err) {
		console.log(err)
		return false
	}
}

/**
 * Check if getUser() and similar work fine 
 */
const testUserStuff = async (): Promise<boolean> => {
	let okay = true
	const user_id = 7276846

	console.log("\n===> USER FUNCTIONS")
	
	const a1 = await attempt(api.getUser, user_id)
	if (!isOk(a1, !a1 || (a1.id === user_id && validate(a1, "User.Extended")))) okay = false
	const a2 = await attempt(api.getUsers, [user_id, 2])
	if (!isOk(a2, !a2 || (a2.length === 2 && validate(a2, "User.WithCountryCoverGroupsStatisticsrulesets")))) okay = false

	const a3 = await attempt(api.getUserScores, user_id, "best", undefined, {fails: false, lazer: true}, {limit: 5})
	if (!isOk(a3, !a3 || (a3.length === 5 && validate(a3, "Score.WithUserBeatmapBeatmapset")))) okay = false
	const a4 = await attempt(api.getUserScores, 6503700, "firsts", osu.Rulesets.taiko, undefined, {limit: 3})
	if (!isOk(a4, !a4 || (a4.length === 3 && validate(a4, "Score.WithUserBeatmapBeatmapset")))) okay = false
	const a5 = await attempt(api.getUserScores, 9269034, "recent", osu.Rulesets.osu, {fails: true, lazer: true}, {limit: 1})
	// Due to the nature of the test, it might fail, you may adapt the user id
	if (!isOk(a5, !a5 || (a5.length === 1 && validate(a5, "Score.WithUserBeatmapBeatmapset")))) okay = false
	const a6 = await attempt(api.getUserBeatmaps, user_id, "guest")
	if (!isOk(a6, !a6 || (a6.length === 1 && validate(a6, "Beatmapset.Extended.WithBeatmapExtended")))) okay = false
	const a7 = await attempt(api.getUserMostPlayed, user_id)
	if (!isOk(a7, !a7 || (a7[0].beatmapset.title === "furioso melodia" && validate(a7, "Beatmap.Playcount")))) okay = false

	const a8 = await attempt(api.getUserRecentActivity, 7562902, {limit: 25})
	if (!isOk(a8, !a8 || (a8.length <= 25 && validate(a8, "Event.AnyRecentActivity")))) okay = false
	const a9 = await attempt(api.getUserKudosu, user_id, {limit: 5})
	if (!isOk(a9, !a9 || (a9.length === 5 && validate(a9, "User.KudosuHistory")))) okay = false

	return okay
}

/**
 * Check if getBeatmap() and similar work fine 
 */
const testBeatmapStuff = async (): Promise<boolean> => {
	let okay = true
	const beatmap_id = 388463
	const long_str = "Beatmap.Extended.WithFailtimesBeatmapsetextended"

	console.log("\n===> BEATMAP FUNCTIONS")

	const b1 = await attempt(api.lookupBeatmap, {id: beatmap_id})
	if (!isOk(b1, !b1 || (b1.id === beatmap_id && validate(b1, long_str)))) okay = false
	const b2 = await attempt(api.getBeatmap, beatmap_id)
	if (!isOk(b2, !b2 || (b2.beatmapset.title_unicode == "夜啼く兎は夢を見る" && validate(b2, long_str)))) okay = false
	const b3 = await attempt(api.getBeatmaps, [beatmap_id, 4089655])
	if (!isOk(b3, !b3 || (b3.length === 2 && validate(b3, "Beatmap.Extended")))) okay = false

	const b4 = await attempt(api.getBeatmapDifficultyAttributesOsu, 125660, ["DT"])
	if (!isOk(b4, !b4 || (b4.approach_rate.toFixed(2) === "9.67" && validate(b4, "Beatmap.DifficultyAttributes.Osu")))) okay = false
	const b5 = await attempt(api.getBeatmapDifficultyAttributesTaiko, beatmap_id, ["DT"])
	if (!isOk(b5, !b5 || (b5.great_hit_window < 35 && validate(b5, "Beatmap.DifficultyAttributes.Taiko")))) okay = false
	const b6 = await attempt(api.getBeatmapDifficultyAttributesFruits, 705339, ["DT"])
	if (!isOk(b6, !b6 || (b6.approach_rate.toFixed(2) === "10.33" && validate(b6, "Beatmap.DifficultyAttributes.Fruits")))) okay = false
	const b7 = await attempt(api.getBeatmapDifficultyAttributesMania, 3980252, ["DT"])
	if (!isOk(b7, !b7 || (b7.great_hit_window === 40 && validate(b7, "Beatmap.DifficultyAttributes.Mania")))) okay = false
	
	const b8 = await attempt(api.searchBeatmapsets, {categories: "Any"})
	if (!isOk(b8, !b8 || (b8.total >= 10000 && validate(b8.beatmapsets, "Beatmapset.Extended.WithBeatmapExtendedPacktags")))) okay = false
	const b9 = await attempt(api.lookupBeatmapset, {id: beatmap_id})
	if (!isOk(b9, !b9 || (b9.id === 58951 && validate(b9, "Beatmapset.Extended.Plus")))) okay = false
	const b10 = await attempt(api.getBeatmapUserScore, 176960, 7276846, {mods: ["NM"]})
	if (!isOk(b10, !b10 || (b10.score.accuracy < 0.99 && validate(b10, "Beatmap.UserScore")))) okay = false
	const b11 = await attempt(api.getBeatmapUserScores, 203993, 7276846, {ruleset: osu.Rulesets.fruits})
	if (!isOk(b11, !b11 || (b11.length === 1 && validate(b11, "Score")))) okay = false
	const b12 = await attempt(api.getBeatmapset, {id: 1971037})
	if (!isOk(b12, !b12 || (b12.submitted_date?.toISOString().substring(0, 10) === "2023-04-07", validate(b12, "Beatmapset.Extended.Plus")))) okay = false
	const b13 = await attempt(api.getBeatmapPack, "P217")
	if (!isOk(b13, !b13 || (b13.tag === "P217" && validate(b13, "Beatmap.Pack")))) okay = false
	const b14 = await attempt(api.getBeatmapPacks, "tournament")
	if (!isOk(b14, !b14 || (b14.beatmap_packs.length >= 100 && validate(b14.beatmap_packs, "Beatmap.Pack")))) okay = false
	const b15 = await attempt(api.getBeatmapScores, 129891, {legacy_only: true})
	if (!isOk(b15, !b15 || (b15[0].score >= 132408001 && validate(b15, "Score.WithUser")))) okay = false
	const b16 = await attempt(api.getBeatmapSoloScores, 129891)
	if (!isOk(b16, !b16 || (b16[0].total_score >= 1073232 && validate(b16, "Score.Solo")))) okay = false

	const b17 = await attempt(api.getBeatmapsetDiscussions, {beatmapset: {id: 2119925}})
	if (!isOk(b17, !b17 || (validate(b17.beatmaps, "Beatmap.Extended") && validate(b17.beatmapsets, "Beatmapset.Extended") &&
	validate(b17.users, "User.WithGroups") && validate(b17.discussions, "Beatmapset.Discussion.WithStartingpost") &&
	validate(b17.included_discussions, "Beatmapset.Discussion.WithStartingpost")))) okay = false
	const b18 = await attempt(api.getBeatmapsetDiscussionPosts, {discussion: {id: 4143461}})
	if (!isOk(b18, !b18 || (validate(b18.beatmapsets, "Beatmapset.WithHype") && validate(b18.users, "User") &&
	validate(b18.posts, "Beatmapset.Discussion.Post")))) okay = false
	const b19 = await attempt(api.getBeatmapsetDiscussionVotes, {vote_receiver: {id: 7276846}})
	if (!isOk(b19, !b19 || (validate(b19.votes, "Beatmapset.Discussion.Vote") && validate(b19.discussions, "Beatmapset.Discussion") &&
	validate(b19.users, "User.WithGroups")))) okay = false
	const b20 = await attempt(api.getBeatmapsetEvents)
	if (!isOk(b20, !b20 || (validate(b20.events, "Beatmapset.Event") && validate(b20.users, "User.WithGroups")))) okay = false

	return okay
}

/**
 * Check if getChangelogBuild() and similar work fine 
 */
const testChangelogStuff = async (): Promise<boolean> => {
	let okay = true

	console.log("\n===> CHANGELOG FUNCTIONS")

	const c1 = await attempt(api.lookupChangelogBuild, 7156)
	if (!isOk(c1, !c1 || (c1.display_version == "2023.1008.1" && validate(c1, "Changelog.Build.WithChangelogentriesVersions")))) okay = false
	const c2 = await attempt(api.getChangelogBuild, "lazer", "2023.1008.1")
	if (!isOk(c2, !c2 || (c2.id === 7156 && validate(c2, "Changelog.Build.WithChangelogentriesVersions")))) okay = false
	const c3 = await attempt(api.getChangelogBuilds, undefined, {from: "2023.1031.0", to: 7184}, ["markdown"])
	if (!isOk(c3, !c3 || (c3.length === 4 && validate(c3, "Changelog.Build.WithUpdatestreamsChangelogentries")))) okay = false
	const c4 = await attempt(api.getChangelogStreams)
	if (!isOk(c4, !c4 || (c4.length > 2 && validate(c4, "Changelog.UpdateStream.WithLatestbuildUsercount")))) okay = false

	return okay
}

/**
 * Check if getRoom(), getMatch() and similar work fine
 */
const testMultiplayerStuff = async (): Promise<boolean> => {
	let okay = true

	console.log("\n===> MULTIPLAYER FUNCTIONS")

	const d1 = await attempt(api.getRoom, {id: 591993})
	if (!isOk(d1, !d1 || (d1.recent_participants.length === 5 && validate(d1, "Multiplayer.Room")))) okay = false
	const d2 = await attempt(api.getRoom, {id: 588230})
	if (!isOk(d2, !d2 || (d2.participant_count === 27 && validate(d2, "Multiplayer.Room")))) okay = false
	if (d1) {
		const d3 = await attempt(api.getPlaylistItemScores, {id: d1.playlist[0].id, room_id: d1.id})
		if (!isOk(d3, !d3 || (d3.scores.length > 0 && validate(d3, "Multiplayer.Room.PlaylistItem.Scores")), 1)) okay = false
	}
	if (d2) {
		const d4 = await attempt(api.getPlaylistItemScores, {id: d2.playlist[0].id, room_id: d2.id})
		if (!isOk(d4, !d4 || (d4.scores.length >= 9 && validate(d4, "Multiplayer.Room.PlaylistItem.Scores")), 1)) okay = false
	}
	const d5 = await attempt(api.getMatch, 62006076)
	if (!isOk(d5, !d5 || (d5.match.name === "CWC2020: (Italy) vs (Indonesia)" && validate(d5, "Multiplayer.Match")), 3)) okay = false
	const d6 = await attempt(api.getMatches)
	if (!isOk(d6, !d6 || (d6[0].id > 111250329 && validate(d6, "Multiplayer.Match.Info")))) okay = false

	return okay
}

/**
 * Check if getRanking() and similar work fine
 */
const testRankingStuff = async (): Promise<boolean> => {
	let okay = true

	console.log("\n===> RANKING FUNCTIONS")

	const e1 = await attempt(api.getKudosuRanking)
	if (!isOk(e1, !e1 || (e1[0].kudosu.total > 10000 && validate(e1, "User.WithKudosu")))) okay = false
	const e2 = await attempt(api.getUserRanking, osu.Rulesets.osu, "score", 1, "all", "FR")
	if (!isOk(e2, !e2 || (e2.ranking[0].level.current > 106 && validate(e2, "Ranking.User")), 2)) okay = false
	const e3 = await attempt(api.getCountryRanking, osu.Rulesets.osu)
	if (!isOk(e3, !e3 || (e3.ranking[0].code === "US" && validate(e3, "Ranking.Country")))) okay = false
	const e4 = await attempt(api.getSpotlightRanking, osu.Rulesets.taiko, {id: 48})
	if (!isOk(e4, !e4 || (e4.ranking[0].hit_accuracy === 97.85 && validate(e4, "Ranking.Spotlight")), 2)) okay = false
	const e5 = await attempt(api.getSpotlights)
	if (!isOk(e5, !e5 || (e5.length >= 132 && validate(e5, "Spotlight")))) okay = false

	return okay
}

/**
 * Check if searchUser() and similar work fine
 */
const testHomeStuff = async (): Promise<boolean> => {
	let okay = true

	console.log("\n===> HOME FUNCTIONS")

	const f1 = await attempt(api.searchUser, "Tae", 2)
	if (!isOk(f1, !f1 || (f1.data.length === 20 && validate(f1, "Home.Search.User")))) okay = false
	const f2 = await attempt(api.searchWiki, "Beat", 2)
	if (!isOk(f2, !f2 || (f2.data.length === 50 && validate(f2, "Home.Search.Wiki")))) okay = false
	const f3 = await attempt(api.getWikiPage, "Rules")
	if (!isOk(f3, !f3 || (f3.title === "Rules" && validate(f3, "WikiPage")))) okay = false
	const f4 = await attempt(api.getNewsPosts)
	if (!isOk(f4, !f4 || (f4.length >= 1 && validate(f4, "NewsPost")))) okay = false
	const f5 = await attempt(api.getNewsPost, {id: 26})
	if (!isOk(f5, !f5 || (f5.title === "Official osu! Fanart Contest 5 Begins!" && validate(f5, "NewsPost.WithContentNavigation")))) okay = false

	return okay
}

const testMiscStuff = async (): Promise<boolean> => {
	let okay = true

	console.log("\n===> MISC FUNCTIONS")

	const g1 = await attempt(api.getForumTopicAndPosts, {id: 1848236}, 2)
	if (!isOk(g1, !g1 || (g1.topic.title === "survey" && validate(g1.topic, "Forum.Topic") && validate(g1.posts, "Forum.Post")))) okay = false
	const g2 = await attempt(api.getEvents)
	if (!isOk(g2, !g2 || (g2.events.length === 50 && validate(g2.events, "Event.Any")))) okay = false
	const g3 = await attempt(api.getSeasonalBackgrounds)
	if (!isOk(g3, !g3 || (g3.ends_at > new Date("2024-01-01") && g3.backgrounds.length > 0))) okay = false
	const g4 = await attempt(api.getComments)
	if (!isOk(g4, !g4 || validate(g4, "Comment.Bundle"))) okay = false
	const g5 = await attempt(api.getComments, {type: "beatmapset", id: 1971037})
	if (!isOk(g5, !g5 || validate(g5, "Comment.Bundle"))) okay = false
	const g6 = await attempt(api.getComments, {type: "build", id: 7463})
	if (!isOk(g6, !g6 || validate(g6, "Comment.Bundle"))) okay = false
	const g7 = await attempt(api.getComments, {type: "news_post", id: 1451})
	if (!isOk(g7, !g7 || validate(g7, "Comment.Bundle"))) okay = false
	const g8 = await attempt(api.getComment, {id: 2418884})
	if (!isOk(g8, !g8 || (g8.users.find((u) => u.id === 8) && validate(g8, "Comment.Bundle")))) okay = false

	return okay
}

const test = async (id: string, secret: string): Promise<void> => {
	api = await osu.API.createAsync({id: Number(id), secret}, undefined, "all") //"http://127.0.0.1:8080")

	const tests = [
		testUserStuff,
		testBeatmapStuff,
		testChangelogStuff,
		testMultiplayerStuff,
		testRankingStuff,
		testHomeStuff,
		testMiscStuff,
	]

	const results: {test_name: string, passed: boolean}[] = []
	for (let i = 0; i < tests.length; i++) {
		results.push({test_name: tests[i].name, passed: await tests[i]()})
	}
	console.log("\n", ...results.map((r) => `${r.test_name}: ${r.passed ? "✔️" : "❌"}\n`))

	if (!results.find((r) => !r.passed)) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

test(process.env.ID, process.env.SECRET)
