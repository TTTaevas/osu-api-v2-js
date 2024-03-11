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

		if (Array.isArray(object)) {
			for (let i = 0; i < object.length; i++) {
				let result = validator(object[i])
				if (validator.errors) console.error(validator.errors)
				if (!result) return false
			}
			return true
		} else {
			let result = validator(object)
			if (validator.errors) console.error(validator.errors)
			return result
		}
	} catch(err) {
		console.log(err)
		return true
	}
}

/**
 * Check if getUser() and similar work fine 
 */
const testUserStuff = async (user_gen: tsj.SchemaGenerator, score_gen: tsj.SchemaGenerator,
	beat_gen: tsj.SchemaGenerator, event_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true
	const user_id = 7276846
	
	let a1 = await <Promise<ReturnType<typeof api.getUser> | false>>attempt("\ngetUser: ", api.getUser({id: user_id}))
	if (!isOk(a1, !a1 || (a1.id === user_id && validate(a1, "User.Extended", user_gen)))) okay = false
	let a2 = await <Promise<ReturnType<typeof api.getUsers> | false>>attempt("getUsers: ", api.getUsers([user_id, 2].map((i) => {return {id: i}})))
	if (!isOk(a2, !a2 || (a2.length === 2 && validate(a2, "User.WithCountryCoverGroupsStatisticsrulesets", user_gen)))) okay = false

	let a3 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores (best): ", api.getUserScores({id: user_id}, "best", 5))
	if (!isOk(a3, !a3 || (a3.length === 5 && validate(a3, "Score.WithUserBeatmapBeatmapset", score_gen)))) okay = false
	let a4 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt("getUserScores (firsts): ", api.getUserScores({id: 6503700}, "firsts", 3))
	if (!isOk(a4, !a4 || (a4.length === 3 && validate(a4, "Score.WithUserBeatmapBeatmapset", score_gen)))) okay = false
	let a5 = await <Promise<ReturnType<typeof api.getUserScores> | false>>attempt(
		"getUserScores (recent): ", api.getUserScores({id: 9269034}, "recent", 1, undefined, true))
	// Due to the nature of the test, it might fail, you may adapt the user id
	if (!isOk(a5, !a5 || (a5.length === 1 && validate(a5, "Score.WithUserBeatmapBeatmapset", score_gen)))) okay = false

	// Those are tested here to be consistent with index.ts and the API server's documentation
	let a6 = await <Promise<ReturnType<typeof api.getUserBeatmaps> | false>>attempt("getUserBeatmaps: ", api.getUserBeatmaps({id: user_id}, "guest"))
	if (!isOk(a6, !a6 || (a6.length === 1 && validate(a6, "Beatmapset.Extended.WithBeatmapExtended", beat_gen)))) okay = false
	let a7 = await <Promise<ReturnType<typeof api.getUserMostPlayed> | false>>attempt("getUserMostPlayed: ", api.getUserMostPlayed({id: user_id}))
	if (!isOk(a7, !a7 || (a7[0].beatmapset.title === "furioso melodia" && validate(a7, "Beatmap.Playcount", beat_gen)))) okay = false

	let a8 = await <Promise<ReturnType<typeof api.getUserRecentActivity> | false>>attempt("getUserRecentActivity: ", api.getUserRecentActivity({id: 7562902}, 25))
	if (!isOk(a8, !a8 || (a8.length <= 25 && validate(a8, "Event.AnyRecentActivity", event_gen)))) okay = false
	let a9 = await <Promise<ReturnType<typeof api.getUserKudosu> | false>>attempt("getUserKudosu: ", api.getUserKudosu({id: user_id}, 5))
	if (!isOk(a9, !a9 || (a9.length === 5 && validate(a9, "User.KudosuHistory", user_gen)))) okay = false

	return okay
}

/**
 * Check if getBeatmap() and similar work fine 
 */
const testBeatmapStuff = async (beat_gen: tsj.SchemaGenerator, score_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true
	const beatmap_id = 388463
	const long_str = "Beatmap.Extended.WithFailtimesBeatmapsetextended"

	let b1 = await <Promise<ReturnType<typeof api.lookupBeatmap> | false>>attempt("\nlookupBeatmap: ", api.lookupBeatmap({id: beatmap_id}))
	if (!isOk(b1, !b1 || (b1.id === beatmap_id && validate(b1, long_str, beat_gen)))) okay = false
	let b2 = await <Promise<ReturnType<typeof api.getBeatmap> | false>>attempt("getBeatmap: ", api.getBeatmap({id: beatmap_id}))
	if (!isOk(b2, !b2 || (b2.beatmapset.title_unicode == "夜啼く兎は夢を見る" && validate(b2, long_str, beat_gen)))) okay = false
	let b3 = await <Promise<ReturnType<typeof api.getBeatmaps> | false>>attempt(
		"getBeatmaps: ", api.getBeatmaps([beatmap_id, 4089655].map((i) => {return {id: i}}))
	)
	if (!isOk(b3, !b3 || (b3.length === 2 && validate(b3, "Beatmap.Extended", beat_gen)))) okay = false

	let b4 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesOsu> | false>>attempt(
		"getBeatmapAttributesOsu: ", api.getBeatmapDifficultyAttributesOsu({id: 125660}, ["DT"]))
	if (!isOk(b4, !b4 || (b4.approach_rate.toFixed(2) === "9.67" && validate(b4, "Beatmap.DifficultyAttributes.Osu", beat_gen)))) okay = false
	let b5 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesTaiko> | false>>attempt(
		"getBeatmapAttributesTaiko: ", api.getBeatmapDifficultyAttributesTaiko({id: beatmap_id}, ["DT"]))
	if (!isOk(b5, !b5 || (b5.great_hit_window < 35 && validate(b5, "Beatmap.DifficultyAttributes.Taiko", beat_gen)))) okay = false
	let b6 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesFruits> | false>>attempt(
		"getBeatmapAttributesFruits: ", api.getBeatmapDifficultyAttributesFruits({id: 705339}, ["DT"]))
	if (!isOk(b6, !b6 || (b6.approach_rate.toFixed(2) === "10.33" && validate(b6, "Beatmap.DifficultyAttributes.Fruits", beat_gen)))) okay = false
	let b7 = await <Promise<ReturnType<typeof api.getBeatmapDifficultyAttributesMania> | false>>attempt(
		"getBeatmapAttributesMania: ", api.getBeatmapDifficultyAttributesMania({id: 3980252}, ["DT"]))
	if (!isOk(b7, !b7 || (b7.great_hit_window === 40 && validate(b7, "Beatmap.DifficultyAttributes.Mania", beat_gen)))) okay = false
	
	let b8 = await <Promise<ReturnType<typeof api.searchBeatmapsets> | false>>attempt("searchBeatmapsets: ", api.searchBeatmapsets({categories: "Any"}))
	if (!isOk(b8, !b8 || (b8.total >= 10000 && validate(b8.beatmapsets, "Beatmapset.Extended.WithBeatmapExtendedPacktags", beat_gen)))) okay = false
	let b9 = await <Promise<ReturnType<typeof api.lookupBeatmapset> | false>>attempt("lookupBeatmapset: ", api.lookupBeatmapset({id: beatmap_id}))
	if (!isOk(b9, !b9 || (b9.id === 58951 && validate(b9, "Beatmapset.Extended.Plus", beat_gen)))) okay = false
	let b10 = await <Promise<ReturnType<typeof api.getBeatmapUserScore> | false>>attempt(
		"getBeatmapUserScore: ", api.getBeatmapUserScore({id: 176960}, {id: 7276846}, ["NM"]))
	if (!isOk(b10, !b10 || (b10.score.accuracy < 0.99 && validate(b10, "BeatmapUserScore", score_gen)))) okay = false
	let b11 = await <Promise<ReturnType<typeof api.getBeatmapUserScores> | false>>attempt(
		"getBeatmapUserScores: ", api.getBeatmapUserScores({id: 203993}, {id: 7276846}, osu.Rulesets.fruits))
	if (!isOk(b11, !b11 || (b11.length === 1 && validate(b11, "Score", score_gen)))) okay = false
	let b12 = await <Promise<ReturnType<typeof api.getBeatmapset> | false>>attempt("getBeatmapset: ", api.getBeatmapset({id: 1971037}))
	if (!isOk(b12, !b12 || (b12.submitted_date?.toISOString().substring(0, 10) === "2023-04-07", validate(b12, "Beatmapset.Extended.Plus", beat_gen)))) okay = false
	let b13 = await <Promise<ReturnType<typeof api.getBeatmapPack> | false>>attempt("getBeatmapPack: ", api.getBeatmapPack({tag: "P217"}))
	if (!isOk(b13, !b13 || (b13.tag === "P217" && validate(b13, "Beatmap.Pack", beat_gen)))) okay = false
	let b14 = await <Promise<ReturnType<typeof api.getBeatmapPacks> | false>>attempt("getBeatmapPacks: ", api.getBeatmapPacks("tournament"))
	if (!isOk(b14, !b14 || (b14.length >= 100 && validate(b14, "Beatmap.Pack", beat_gen)))) okay = false
	let b15 = await <Promise<ReturnType<typeof api.getBeatmapScores> | false>>attempt("getBeatmapScores: ", api.getBeatmapScores({id: 129891}, false))
	if (!isOk(b15, !b15 || (b15[0].score >= 132408001 && validate(b15, "Score.WithUser", score_gen)))) okay = false
	let b16 = await <Promise<ReturnType<typeof api.getBeatmapSoloScores> | false>>attempt("getBeatmapSoloScores: ", api.getBeatmapSoloScores({id: 129891}))
	if (!isOk(b16, !b16 || (b16[0].total_score >= 1073232 && validate(b16, "Score.Solo", score_gen)))) okay = false

	return okay
}

/**
 * Check if getChangelogBuild() and similar work fine 
 */
const testChangelogStuff = async (changelog_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true

	let c1 = await <Promise<ReturnType<typeof api.lookupChangelogBuild> | false>>attempt("\nlookupChangelogBuild: ", api.lookupChangelogBuild("7156", true))
	if (!isOk(c1, !c1 || (c1.display_version == "2023.1008.1" && validate(c1, "Changelog.Build.WithChangelogentriesVersions", changelog_gen)))) okay = false
	let c2 = await <Promise<ReturnType<typeof api.getChangelogBuild> | false>>attempt("getChangelogBuild: ", api.getChangelogBuild("lazer", "2023.1008.1"))
	if (!isOk(c2, !c2 || (c2.id === 7156 && validate(c2, "Changelog.Build.WithChangelogentriesVersions", changelog_gen)))) okay = false
	let c3 = await <Promise<ReturnType<typeof api.getChangelogBuilds> | false>>attempt(
		"getChangelogBuilds: ", api.getChangelogBuilds({from: "2023.1031.0", to: "20231102.3"}, 7184, undefined, ["markdown"]))
	if (!isOk(c3, !c3 || (c3.length === 4 && validate(c3, "Changelog.Build.WithUpdatestreamsChangelogentries", changelog_gen)))) okay = false
	let c4 = await <Promise<ReturnType<typeof api.getChangelogStreams> | false>>attempt("getChangelogStreams: ", api.getChangelogStreams())
	if (!isOk(c4, !c4 || (c4.length > 2 && validate(c4, "Changelog.UpdateStream.WithLatestbuildUsercount", changelog_gen)))) okay = false

	return okay
}

/**
 * Check if getRoom(), getMatch() and similar work fine
 */
const testMultiplayerStuff = async (multi_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true

	let d1 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("\ngetRoom (realtime): ", api.getRoom({id: 591993}))
	if (!isOk(d1, !d1 || (d1.recent_participants.length === 5 && validate(d1, "Multiplayer.Room", multi_gen)))) okay = false
	let d2 = await <Promise<ReturnType<typeof api.getRoom> | false>>attempt("getRoom (playlist): ", api.getRoom({id: 588230}))
	if (!isOk(d2, !d2 || (d2.participant_count === 27 && validate(d2, "Multiplayer.Room", multi_gen)))) okay = false
	if (d1) {
		let d3 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (realtime): ", api.getPlaylistItemScores({id: d1.playlist[0].id, room_id: d1.id}))
		if (!isOk(d3, !d3 || (d3.scores.length > 0 && validate(d3, "Multiplayer.Scores", multi_gen)), 1)) okay = false
	}
	if (d2) {
		let d4 = await <Promise<ReturnType<typeof api.getPlaylistItemScores> | false>>attempt(
			"getPlaylistItemScores (playlist): ", api.getPlaylistItemScores({id: d2.playlist[0].id, room_id: d2.id}))
		if (!isOk(d4, !d4 || (d4.scores.length >= 9 && validate(d4, "Multiplayer.Scores", multi_gen)), 1)) okay = false
	}
	let d5 = await <Promise<ReturnType<typeof api.getMatch> | false>>attempt("getMatch: ", api.getMatch(62006076))
	if (!isOk(d5, !d5 || (d5.match.name === "CWC2020: (Italy) vs (Indonesia)" && validate(d5, "Multiplayer.Match", multi_gen)), 3)) okay = false
	let d6 = await <Promise<ReturnType<typeof api.getMatches> | false>>attempt("getMatches: ", api.getMatches())
	if (!isOk(d6, !d6 || (d6[0].id > 111250329 && validate(d6, "Multiplayer.MatchInfo", multi_gen)))) okay = false

	return okay
}

/**
 * Check if getRanking() and similar work fine
 */
const testRankingStuff = async (rank_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true

	let e1 = await <Promise<ReturnType<typeof api.getKudosuRanking> | false>>attempt("\ngetKudosuRanking: ", api.getKudosuRanking())
	if (!isOk(e1, !e1 || (e1[0].kudosu.total > 10000 && validate(e1, "User.WithKudosu", rank_gen)))) okay = false
	let e2 = await <Promise<ReturnType<typeof api.getUserRanking> | false>>attempt(
		"getUserRanking: ", api.getUserRanking(osu.Rulesets.osu, "score", 1, "all", "FR"))
	if (!isOk(e2, !e2 || (e2.ranking[0].level.current > 106 && validate(e2, "Rankings.User", rank_gen)), 2)) okay = false
	let e3 = await <Promise<ReturnType<typeof api.getCountryRanking> | false>>attempt("getCountryRanking: ", api.getCountryRanking(osu.Rulesets.osu))
	if (!isOk(e3, !e3 || (e3.ranking[0].code === "US" && validate(e3, "Rankings.Country", rank_gen)))) okay = false
	let e4 = await <Promise<ReturnType<typeof api.getSpotlightRanking> | false>>attempt(
		"getSpotlightRanking: ", api.getSpotlightRanking(osu.Rulesets.taiko, {id: 48}))
	if (!isOk(e4, !e4 || (e4.ranking[0].hit_accuracy === 97.85 && validate(e4, "Rankings.Spotlight", rank_gen)), 2)) okay = false
	let e5 = await <Promise<ReturnType<typeof api.getSpotlights> | false>>attempt("getSpotlights: ", api.getSpotlights())
	if (!isOk(e5, !e5 || (e5.length >= 132 && validate(e5, "Spotlight", rank_gen)))) okay = false

	return okay
}

/**
 * Check if searchUser() and similar work fine
 */
const testHomeStuff = async (home_gen: tsj.SchemaGenerator, news_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true

	let f1 = await <Promise<ReturnType<typeof api.searchUser> | false>>attempt("\nsearchUser: ", api.searchUser("Tae", 2))
	if (!isOk(f1, !f1 || (f1.data.length === 20 && validate(f1, "SearchResult.User", home_gen)))) okay = false
	let f2 = await <Promise<ReturnType<typeof api.searchWiki> | false>>attempt("searchWiki: ", api.searchWiki("Beat", 2))
	if (!isOk(f2, !f2 || (f2.data.length === 50 && validate(f2, "SearchResult.Wiki", home_gen)))) okay = false
	let f3 = await <Promise<ReturnType<typeof api.getWikiPage> | false>>attempt("getWikiPage: ", api.getWikiPage("Rules"))
	if (!isOk(f3, !f3 || (f3.title === "Rules" && validate(f3, "WikiPage", home_gen)))) okay = false
	let f4 = await <Promise<ReturnType<typeof api.getNewsPosts> | false>>attempt("getNews: ", api.getNewsPosts())
	if (!isOk(f4, !f4 || (f4.length >= 1 && validate(f4, "News.Post", news_gen)))) okay = false
	let f5 = await <Promise<ReturnType<typeof api.getNewsPost> | false>>attempt("getNewsPost: ", api.getNewsPost({id: 26}))
	if (!isOk(f5, !f5 || (f5.title === "Official osu! Fanart Contest 5 Begins!" && validate(f5, "News.PostWithContentNavigation", news_gen)))) okay = false

	return okay
}

const testMiscStuff = async (forum_gen: tsj.SchemaGenerator, event_gen: tsj.SchemaGenerator): Promise<boolean> => {
	let okay = true

	let g1 = await <Promise<ReturnType<typeof api.getForumTopicAndPosts> | false>>attempt("\ngetForumTopicAndPosts: ", api.getForumTopicAndPosts({id: 1848236}, 2))
	if (!isOk(g1, !g1 || (g1.topic.title === "survey" && validate(g1.topic, "Forum.Topic", forum_gen) && validate(g1.posts, "Forum.Post", forum_gen)))) okay = false
	let g2 = await <Promise<ReturnType<typeof api.getEvents> | false>>attempt("getEvents: ", api.getEvents())
	if (!isOk(g2, !g2 || (g2.events.length === 50 && validate(g2.events, "Event.Any", event_gen)))) okay = false
	let g3 = await <Promise<ReturnType<typeof api.getSeasonalBackgrounds> | false>>attempt("getSeasonalBackgrounds: ", api.getSeasonalBackgrounds())
	if (!isOk(g3, !g3 || (g3.ends_at > new Date("2024-01-01") && g3.backgrounds.length > 0))) okay = false

	return okay
}

const test = async (id: string, secret: string): Promise<void> => {
	api = await osu.API.createAsync({id: Number(id), secret}, undefined, "all") //"http://127.0.0.1:8080")
	
	const score_gen = tsj.createGenerator({path: "lib/score.ts", additionalProperties: true})
	const user_gen = tsj.createGenerator({path: "lib/user.ts", additionalProperties: true})
	const beat_gen = tsj.createGenerator({path: "lib/beatmap.ts", additionalProperties: true})
	const event_gen = tsj.createGenerator({path: "lib/event.ts", additionalProperties: true})

	const a = await testUserStuff(user_gen, score_gen, beat_gen, event_gen)
	const b = await testBeatmapStuff(beat_gen, score_gen)
	const c = await testChangelogStuff(tsj.createGenerator({path: "lib/changelog.ts", additionalProperties: true}))
	const d = await testMultiplayerStuff(tsj.createGenerator({path: "lib/multiplayer.ts", additionalProperties: true}))
	const e = await testRankingStuff(tsj.createGenerator({path: "lib/ranking.ts", additionalProperties: true}))
	const f = await testHomeStuff(
		tsj.createGenerator({path: "lib/home.ts", additionalProperties: true}),
		tsj.createGenerator({path: "lib/news.ts", additionalProperties: true})
	)
	const g = await testMiscStuff(tsj.createGenerator({path: "lib/forum.ts", additionalProperties: true}), event_gen)

	const arr = [a,b,c,d,e,f,g]

	const test_results = arr.map((bool: boolean, index: number) => bool ? `${index + 1}: ✔️\n` : `${index + 1}: ❌\n`)
	console.log("\n", ...test_results)
	if (arr.indexOf(false) === -1) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

test(process.env.ID, process.env.SECRET)
