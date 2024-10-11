/**
 * The Client Credentials way
 * The token is considered by the API as a guest user
 */

import * as osu from "../index.js"
import "dotenv/config"
import util from "util"

// Because of the way tests are made, some things in the package are basic types instead of referring to other properties
// A basic example would be WikiPage's available_locales, which could've been WikiPage["locale"]
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
		console.error("❌ from attempt:\n", util.inspect(err, {colors: true, compact: true, depth: 100}), "\n\n")
		return false
	}
}

function meetsCondition(obj: any, condition: boolean) {
	if (condition === false) console.error("❌ from meetsCondition:\n", util.inspect(obj, {colors: true, compact: true, depth: 100}), "\n\n")
	return condition
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
				if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
					util.inspect(object[i], {colors: true, compact: true, depth: 100}), "\n\n")
				if (!result) return false
			}
			return true
		} else {
			const result = validator(object)
			if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
				util.inspect(object, {colors: true, compact: true, depth: 100}), "\n\n")
			return result
		}
	} catch(err) {
		console.log(err)
		return false
	}
}


// THE ACTUAL TESTS

const testBeatmapPack = async (): Promise<boolean> => {
	console.log("\n===> BEATMAP PACK")
	let okay = true
	const a = await attempt(api.getBeatmapPack, "P217")
	if (!a || !meetsCondition(a, a.tag === "P217") || !validate(a, "Beatmap.Pack.WithBeatmapset")) okay = false
	const b = await attempt(api.getBeatmapPacks, "tournament")
	if (!b || !meetsCondition(b, b.beatmap_packs.length >= 100) || !validate(b.beatmap_packs, "Beatmap.Pack")) okay = false
	return okay
}

const testBeatmap = async (): Promise<boolean> => {
	console.log("\n===> BEATMAP")
	let okay = true
	const [beatmap_id, long_str] = [388463, "Beatmap.Extended.WithFailtimesBeatmapset"]

	const a = await attempt(api.lookupBeatmap, {id: beatmap_id})
	if (!a || !meetsCondition(a, a.id === beatmap_id) || !validate(a, long_str)) okay = false
	const b = await attempt(api.getBeatmap, beatmap_id)
	if (!b || !meetsCondition(b, b.beatmapset.title_unicode === "夜啼く兎は夢を見る") || !validate(b, long_str)) okay = false
	const c = await attempt(api.getBeatmaps, [beatmap_id, 4089655])
	if (!c || !meetsCondition(c, c.length === 2) || !validate(c, "Beatmap.Extended")) okay = false

	const d1 = await attempt(api.getBeatmapDifficultyAttributesOsu, 125660, ["DT"])
	if (!d1 || !meetsCondition(d1, d1.approach_rate.toFixed(2) === "9.67") || !validate(d1, "Beatmap.DifficultyAttributes.Osu")) okay = false
	const d2 = await attempt(api.getBeatmapDifficultyAttributesTaiko, beatmap_id, ["DT"])
	if (!d2 || !meetsCondition(d2, d2.great_hit_window < 35) || !validate(d2, "Beatmap.DifficultyAttributes.Taiko")) okay = false
	
	const d3 = await attempt(api.getBeatmapDifficultyAttributesFruits, 705339, ["DT"])
	if (!d3 || !meetsCondition(d3, d3.approach_rate.toFixed(2) === "10.33") || !validate(d3, "Beatmap.DifficultyAttributes.Fruits")) okay = false
	const d4 = await attempt(api.getBeatmapDifficultyAttributesMania, 3980252, ["DT"])
	if (!d4 || !meetsCondition(d4, d4.great_hit_window === 40) || !validate(d4, "Beatmap.DifficultyAttributes.Mania")) okay = false

	const e = await attempt(api.lookupBeatmapset, beatmap_id)
	if (!e || !meetsCondition(e, e.id === 58951) || !validate(e, "Beatmapset.Extended.Plus")) okay = false
	const f = await attempt(api.searchBeatmapsets, {categories: "Any"})
	if (!f || !meetsCondition(f, f.total >= 10000) || !validate(f.beatmapsets, "Beatmapset.Extended.WithBeatmapPacktags")) okay = false
	const g = await attempt(api.getBeatmapUserScore, 176960, 7276846, {mods: ["NM"]})
	if (!g || !meetsCondition(g, g.score.accuracy < 0.99) || !validate(g, "Beatmap.UserScore")) okay = false
	const h = await attempt(api.getBeatmapUserScores, 203993, 7276846, {ruleset: osu.Ruleset.fruits})
	if (!h || !meetsCondition(h, h.length === 1) || !validate(h, "Score")) okay = false

	const i = await attempt(api.getBeatmapScores, 129891, {legacy_only: true})
	if (!i || !meetsCondition(i, i[0].score >= 132408001) || !validate(i, "Score.WithUser")) okay = false
	const j = await attempt(api.getBeatmapSoloScores, 129891)
	if (!j || !meetsCondition(j, j[0].total_score >= 1073232) || !validate(j, "Score.Solo")) okay = false

	return okay
}

const testBeatmapsetDiscussion = async (): Promise<boolean> => {
	console.log("\n===> BEATMAPSET DISCUSSION")
	let okay = true

	const a = await attempt(api.getBeatmapsetDiscussions, {beatmapset: 2119925})
	if (!a || !validate(a.beatmaps, "Beatmap.Extended") || !validate(a.beatmapsets, "Beatmapset.Extended") &&
	!validate(a.users, "User.WithGroups") || !validate(a.discussions, "Beatmapset.Discussion.WithStartingpost") &&
	!validate(a.included_discussions, "Beatmapset.Discussion.WithStartingpost")) okay = false
	const b = await attempt(api.getBeatmapsetDiscussionPosts, {discussion: 4143461})
	if (!b || (!validate(b.beatmapsets, "Beatmapset.WithHype") || !validate(b.users, "User") && !validate(b.posts, "Beatmapset.Discussion.Post"))) okay = false
	const c = await attempt(api.getBeatmapsetDiscussionVotes, {vote_receiver: 7276846})
	if (!c || (!validate(c.votes, "Beatmapset.Discussion.Vote") || !validate(c.discussions, "Beatmapset.Discussion") &&
	!validate(c.users, "User.WithGroups"))) okay = false

	return okay
}

const testBeatmapset = async (): Promise<boolean> => {
	console.log("\n===> BEATMAPSET")
	let okay = true

	const a = await attempt(api.getBeatmapset, 1971037)
	if (!a || !meetsCondition(a, a.submitted_date?.toISOString().substring(0, 10) === "2023-04-07") || !validate(a, "Beatmapset.Extended.Plus")) okay = false

	const events = [
		"nominate", "love", "remove_from_loved", "qualify", "disqualify", "approve", "rank",
		"kudosu_allow", "kudosu_deny", "kudosu_gain", "kudosu_lost", "kudosu_recalculate",
		"issue_resolve", "issue_reopen", "discussion_lock", "discussion_unlock", "discussion_delete", "discussion_restore",
		"discussion_post_delete", "discussion_post_restore", "nomination_reset", "nomination_reset_received",
		"genre_edit", "language_edit", "nsfw_toggle", "offset_edit", "tags_edit", "beatmap_owner_change"
	]
	const unavailable_events = ["discussion_lock", "discussion_unlock", "tags_edit", "approve"]
	const available_events = events.filter((e) => unavailable_events.indexOf(e) === -1)

	for (let i = 0; i < available_events.length; i++) {
		const event = available_events[i]
		const b1 = await attempt(api.getBeatmapsetEvents, {}, [event as any])
		if (!b1 || !validate(b1.events, "Beatmapset.Event.Any") || !validate(b1.users, "User.WithGroups")) okay = false
	}

	const b2 = await attempt(api.getBeatmapsetEvents)
	if (!b2 || !validate(b2.events, "Beatmapset.Event.Any") || !validate(b2.users, "User.WithGroups")) okay = false

	return okay
}

const testChangelog = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> CHANGELOG")

	const a = await attempt(api.lookupChangelogBuild, 7156)
	if (!a || !meetsCondition(a, a.display_version === "2023.1008.1") || !validate(a, "Changelog.Build.WithChangelogentriesVersions")) okay = false
	const b = await attempt(api.getChangelogBuild, "lazer", "2023.1008.1")
	if (!b || !meetsCondition(b, b.id === 7156) || !validate(b, "Changelog.Build.WithChangelogentriesVersions")) okay = false
	const c = await attempt(api.getChangelogBuilds, undefined, {from: "2023.1031.0", to: 7184}, ["markdown"])
	if (!c || !meetsCondition(c, c.length === 4) || !validate(c, "Changelog.Build.WithUpdatestreamsChangelogentries")) okay = false
	const d = await attempt(api.getChangelogStreams)
	if (!d || !meetsCondition(d, d.length > 2) || !validate(d, "Changelog.UpdateStream.WithLatestbuildUsercount")) okay = false

	return okay
}

const testComment = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> COMMENT")

	const a = await attempt(api.getComment, 2418884)
	if (!a || !meetsCondition(a.users, Boolean(a.users.find(((u) => u.id === 32573520)))) || !validate(a, "Comment.Bundle")) okay = false
	const b1 = await attempt(api.getComments)
	if (!b1 || !validate(b1, "Comment.Bundle")) okay = false
	const b2 = await attempt(api.getComments, {type: "beatmapset", id: 1971037})
	if (!b2 || !validate(b2, "Comment.Bundle")) okay = false
	const b3 = await attempt(api.getComments, {type: "build", id: 7463})
	if (!b3 || !validate(b3, "Comment.Bundle")) okay = false
	const b4 = await attempt(api.getComments, {type: "news_post", id: 1451})
	if (!b4 || !validate(b4, "Comment.Bundle")) okay = false

	return okay
}

const testEvent = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> EVENT")
	const a = await attempt(api.getEvents)
	if (!a || !meetsCondition(a, a.events.length === 50) || !validate(a.events, "Event.Any")) okay = false
	return okay
}

const testForum = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> FORUM")
	const a = await attempt(api.getForumTopicAndPosts, 1848236, {limit: 2})
	if (!a || !meetsCondition(a, a.topic.title === "survey") || !validate(a.topic, "Forum.Topic") || !validate(a.posts, "Forum.Post")) okay = false
	return okay
}

const testHome = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> HOME")

	const a1 = await attempt(api.searchUser, "Tae", 2)
	if (!a1 || !meetsCondition(a1, a1.data.length === 20) || !validate(a1.data, "User")) okay = false
	const a2 = await attempt(api.searchWiki, "Beat", 2)
	if (!a2 || !meetsCondition(a2, a2.data.length === 50) || !validate(a2.data, "WikiPage")) okay = false

	return okay
}

const testMultiplayer = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> MULTIPLAYER")

	const a1 = await attempt(api.getRoom, 591993)
	if (!a1 || !meetsCondition(a1, a1.recent_participants.length === 5) || !validate(a1, "Multiplayer.Room")) okay = false
	const a2 = await attempt(api.getRoom, 588230)
	if (!a2 || !meetsCondition(a2, a2.participant_count === 27) || !validate(a2, "Multiplayer.Room")) okay = false
	if (a1) {
		const b1 = await attempt(api.getPlaylistItemScores, {id: a1.playlist[0].id, room_id: a1.id})
		if (!b1 || !meetsCondition(b1, b1.scores.length > 0) || !validate(b1, "Multiplayer.Room.PlaylistItem.Scores")) okay = false
	}
	if (a2) {
		const b2 = await attempt(api.getPlaylistItemScores, {id: a2.playlist[0].id, room_id: a2.id})
		if (!b2 || !meetsCondition(b2, b2.scores.length >= 9) || !validate(b2, "Multiplayer.Room.PlaylistItem.Scores")) okay = false
	}
	const c = await attempt(api.getMatch, 62006076, {limit: 0})
	if (!c || !meetsCondition(c, c.match.name === "CWC2020: (Italy) vs (Indonesia)") || !validate(c, "Multiplayer.Match")) okay = false
	const d = await attempt(api.getMatches, {limit: 2})
	if (!d || !meetsCondition(d, d[0].id > 111250329) || !validate(d, "Multiplayer.Match.Info")) okay = false

	return okay
}

const testNews = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> NEWS")

	const a = await attempt(api.getNewsPost, 26)
	if (!a || !meetsCondition(a, a.title === "Official osu! Fanart Contest 5 Begins!") || !validate(a, "NewsPost.WithContentNavigation")) okay = false
	const b = await attempt(api.getNewsPosts)
	if (!b || !meetsCondition(b, b.length >= 1) || !validate(b, "NewsPost")) okay = false

	return okay
}

const testRanking = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> RANKING")

	const a = await attempt(api.getKudosuRanking)
	if (!a || !meetsCondition(a, a[0].kudosu.total > 10000) || !validate(a, "User.WithKudosu")) okay = false
	const b = await attempt(api.getUserRanking, osu.Ruleset.osu, "score", {country: "FR"})
	if (!b || !meetsCondition(b, b.ranking[0].level.current > 106) || !validate(b, "Ranking.User")) okay = false
	const c = await attempt(api.getCountryRanking, osu.Ruleset.osu)
	if (!c || !meetsCondition(c, c.ranking[0].code === "US") || !validate(c, "Ranking.Country")) okay = false
	const d = await attempt(api.getSpotlightRanking, osu.Ruleset.taiko, 48)
	if (!d || !meetsCondition(d, d.ranking[0].hit_accuracy === 97.85) || !validate(d, "Ranking.Spotlight")) okay = false

	return okay
}

const testUser = async (): Promise<boolean> => {
	let okay = true
	const user_id = 7276846
	console.log("\n===> USER")
	
	const a = await attempt(api.getUser, user_id)
	if (!a || !meetsCondition(a, a.id === user_id) || !validate(a, "User.Extended")) okay = false
	const b = await attempt(api.lookupUsers, [user_id, 2])
	if (!b || !meetsCondition(b, b.length === 2) || !validate(b, "User.WithCountryCoverGroups")) okay = false
	const c = await attempt(api.getUsers, [user_id, 2])
	if (!c || !meetsCondition(c, c.length === 2) || !validate(c, "User.WithCountryCoverGroupsStatisticsrulesets")) okay = false

	const d1 = await attempt(api.getUserScores, user_id, "best", undefined, {fails: false, lazer: true}, {limit: 5})
	if (!d1 || !meetsCondition(d1, d1.length === 5) || !validate(d1, "Score.WithUserBeatmapBeatmapset")) okay = false
	const d2 = await attempt(api.getUserScores, 6503700, "firsts", osu.Ruleset.taiko, undefined, {limit: 3})
	if (!d2 || !meetsCondition(d2, d2.length === 3) || !validate(d2, "Score.WithUserBeatmapBeatmapset")) okay = false
	const d3 = await attempt(api.getUserScores, 9269034, "recent", osu.Ruleset.osu, {fails: true, lazer: true}, {limit: 1})
	// Due to the nature of this test, it might fail, you may adapt the user id
	if (!d3 || !meetsCondition(d3, d3.length === 1) || !validate(d3, "Score.WithUserBeatmapBeatmapset")) okay = false

	const e = await attempt(api.getUserBeatmaps, user_id, "guest")
	if (!e || !meetsCondition(e, e.length === 1) || !validate(e, "Beatmapset.Extended.WithBeatmap")) okay = false
	const f = await attempt(api.getUserMostPlayed, user_id)
	if (!f || !meetsCondition(f, f[0].beatmapset.title === "furioso melodia") || !validate(f, "Beatmap.Playcount")) okay = false
	const g = await attempt(api.getUserRecentActivity, 7562902, {limit: 25})
	if (!g || !meetsCondition(g, g.length <= 25) || !validate(g, "Event.AnyRecentActivity")) okay = false
	const h = await attempt(api.getUserKudosu, user_id, {limit: 5})
	if (!h || !meetsCondition(h, h.length === 5) || !validate(h, "User.KudosuHistory")) okay = false

	return okay
}

const testWiki = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> WIKI")
	const a = await attempt(api.getWikiPage, "Rules")
	if (!a || !meetsCondition(a, a.title === "Rules") || !validate(a, "WikiPage")) okay = false
	return okay
}

const testOther = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> OTHER")

	const a = await attempt(api.getSpotlights)
	if (!a || !meetsCondition(a, a.length >= 132) || !validate(a, "Spotlight")) okay = false
	const b = await attempt(api.getSeasonalBackgrounds)
	if (!b || !meetsCondition(b, b.ends_at > new Date("2024-01-01") && b.backgrounds.length > 0)) okay = false

	return okay
}


const test = async (id: string, secret: string): Promise<void> => {
	api = await osu.API.createAsync({id: Number(id), secret}, undefined, "all") //"http://127.0.0.1:8080")
	api.timeout = 30

	const tests = [
		testBeatmapPack,
		testBeatmap,
		testBeatmapsetDiscussion,
		testBeatmapset,
		testChangelog,
		testComment,
		testEvent,
		testForum,
		testHome,
		testMultiplayer,
		testNews,
		testRanking,
		testUser,
		testWiki,
		testOther,
	]

	const results: {test_name: string, passed: boolean}[] = []
	for (let i = 0; i < tests.length; i++) {
		results.push({test_name: tests[i].name, passed: await tests[i]()})
	}
	console.log("\n", ...results.map((r) => `${r.test_name}: ${r.passed ? "✔️" : "❌"}\n`))
	await api.revokeToken()

	if (!results.find((r) => !r.passed)) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

test(process.env.ID, process.env.SECRET)
