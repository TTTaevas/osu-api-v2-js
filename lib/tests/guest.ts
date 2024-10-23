/**
 * The Client Credentials way
 * The token is considered by the API as a guest user
 * https://osu.ppy.sh/docs/index.html#client-credentials-grant
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

// ajv will not work properly if type is not changed from string to object where format is date-time
function fixDate(arg: any) {
	if (typeof arg === "object" && arg !== null) {
		if (arg["format"] && arg["format"] === "date-time" && arg["type"] && arg["type"] === "string") {
			arg["type"] = "object"
		}

		const keys = Object.keys(arg)
		const value = Object.values(arg)
		for (let i = 0; i < keys.length; i++) {
			arg[keys[i]] = fixDate(value[i])
		}
	}

	return arg
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

type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

class Test<
	F extends (...args: any[]) => Promise<T>,
	T,
	P extends Partial<AR<F>>
> {
	fun: F
	args: Parameters<F>
	schema?: string | {[key in keyof P]: string}
	conditions?: P | ((arg0: T) => boolean)[]
	response: T | false = false

	constructor(fun: F, args: Parameters<F>, schema?: string | {[key in keyof P]: string}, conditions?: P | ((arg0: T) => boolean)[]) {
		this.fun = fun
		this.args = args
		this.schema = schema
		this.conditions = conditions
	}

	async try() {
		const pure_response = await attempt(this.fun, ...this.args)
        const response = pure_response as {[k: string]: any}
		let validation_pass = Boolean(response)
		let condition_pass = true

		if (pure_response && response) {
			
			if (typeof this.schema === "string") {
				validation_pass = validate(response, this.schema)
			} else if (this.schema) {
				for (let i = 0; i < Object.keys(this.schema).length; i++) {
					validation_pass = !validation_pass ? false : validate(response[Object.keys(this.schema)[i]], Object.values(this.schema)[i] as string)
				}
			}

			if (validation_pass) {

				if (Array.isArray(this.conditions)) {
					for (let i = 0; i < this.conditions.length; i++) {
						const condition = this.conditions[i]
						if (!condition(pure_response)) {
							console.error("❌ from condition checking:\n",
							`It seems like the anonymous function index ${i} failed...\n`,
							`(for the following object)\n`,
							util.inspect(pure_response, {colors: true, compact: true, depth: 3}), "\n\n")
							condition_pass = false
						}
					}
				} else {
					for (let property in this.conditions) {
						if (!(property in response) || response[property] !== this.conditions[property]) {
							console.error("❌ from condition checking:\n",
							`It seems like something is wrong with the property: ${property}\n`,
							`Expected ${this.conditions[property]}\n`,
							`Instead got ${response[property]} (for the following object)\n`,
							util.inspect(response, {colors: true, compact: true, depth: 1}), "\n\n")
							condition_pass = false
						}
					}
				}
			} else {condition_pass = false}
		} else {condition_pass = false}

		this.response = pure_response
		return {passes: [Boolean(response), validation_pass, condition_pass], response: response}
    }
}


// THE ACTUAL TESTS

const testBeatmapPack = () => [
	new Test(api.getBeatmapPack, ["P217"], "Beatmap.Pack.WithBeatmapset", {tag: "P217"}),
	new Test(api.getBeatmapPacks, ["tournament"], {beatmap_packs: "Beatmap.Pack"},
		[(r: AR<typeof api.getBeatmapPacks>) => r.beatmap_packs.length >= 100]),
]

const testBeatmap = () => [
	new Test(api.lookupBeatmap, [{id: 388463}], "Beatmap.Extended.WithFailtimesBeatmapset", {id: 388463}),
	new Test(api.getBeatmap, [388463], "Beatmap.Extended.WithFailtimesBeatmapset",
		[(r: AR<typeof api.getBeatmap>) => r.beatmapset.title_unicode === "夜啼く兎は夢を見る"]),
	new Test(api.getBeatmaps, [[388463, 4089655]], "Beatmap.Extended",
		[(r: AR<typeof api.getBeatmaps>) => r.length === 2]),
	
	new Test(api.getBeatmapDifficultyAttributesOsu, [125660, ["DT"]], "Beatmap.DifficultyAttributes.Osu",
		[(r: AR<typeof api.getBeatmapDifficultyAttributesOsu>) => r.approach_rate.toFixed(2) === "9.67"]),
	new Test(api.getBeatmapDifficultyAttributesTaiko, [388463, ["DT"]], "Beatmap.DifficultyAttributes.Taiko",
		[(r: AR<typeof api.getBeatmapDifficultyAttributesTaiko>) => r.great_hit_window < 35]),
	new Test(api.getBeatmapDifficultyAttributesFruits, [705339, ["DT"]], "Beatmap.DifficultyAttributes.Fruits",
		[(r: AR<typeof api.getBeatmapDifficultyAttributesFruits>) => r.approach_rate.toFixed(2) === "10.33"]),
	new Test(api.getBeatmapDifficultyAttributesMania, [3980252, ["DT"]], "Beatmap.DifficultyAttributes.Mania",
		[(r: AR<typeof api.getBeatmapDifficultyAttributesMania>) => r.great_hit_window === 40]),
	
	new Test(api.lookupBeatmapset, [388463], "Beatmapset.Extended.Plus", {id: 58951}),
	new Test(api.searchBeatmapsets, [{categories: "Any"}], {beatmapsets: "Beatmapset.Extended.WithBeatmapPacktags"},
		[(r: AR<typeof api.searchBeatmapsets>) => r.total >= 10000]),
	
	new Test(api.getBeatmapUserScore, [176960, 7276846, {mods: ["NM"]}], "Beatmap.UserScore",
		[(r: AR<typeof api.getBeatmapUserScore>) => r.score.accuracy < 0.99]),
	new Test(api.getBeatmapUserScores, [203993, 7276846, {ruleset: osu.Ruleset.fruits}], "Score",
		[(r: AR<typeof api.getBeatmapUserScores>) => r.length === 1]),
	new Test(api.getBeatmapScores, [129891, {legacy_only: true}], "Score.WithUser",
		[(r: AR<typeof api.getBeatmapScores>) => r[0].score >= 132408001]),
	new Test(api.getBeatmapSoloScores, [129891], "Score.Solo",
		[(r: AR<typeof api.getBeatmapSoloScores>) => r[0].total_score >= 1073232]),
]

const testBeatmapsetDiscussion = () => [
	new Test(api.getBeatmapsetDiscussions, [{beatmapset: 2119925}], {
		beatmaps: "Beatmap.Extended",
		beatmapsets: "Beatmapset.Extended",
		users: "User.WithGroups",
		discussions: "Beatmapset.Discussion.WithStartingpost",
		included_discussions: "Beatmapset.Discussion.WithStartingpost"
	}),
	new Test(api.getBeatmapsetDiscussionPosts, [{discussion: 4143461}], {
		beatmapsets: "Beatmapset.WithHype",
		users: "User",
		posts: "Beatmapset.Discussion.Post"
	}),
	new Test(api.getBeatmapsetDiscussionVotes, [{vote_receiver: 7276846}], {
		users: "User.WithGroups",
		votes: "Beatmapset.Discussion.Vote",
		discussions: "Beatmapset.Discussion"
	})
]

const testBeatmapset = () => {
	const tests: Test<any, any, any>[] = [
		new Test(api.getBeatmapset, [1971037], "Beatmapset.Extended.Plus",
			[(r: AR<typeof api.getBeatmapset>) => r.submitted_date?.toISOString().substring(0, 10) === "2023-04-07"]),
		new Test(api.getBeatmapsetEvents, [{}], {events: "Beatmapset.Event.Any", users: "User.WithGroups"})
	]

	const events: osu.Beatmapset.Event["type"][] = [
		"nominate", "love", "remove_from_loved", "qualify", "disqualify", "approve", "rank",
		"kudosu_allow", "kudosu_deny", "kudosu_gain", "kudosu_lost", "kudosu_recalculate",
		"issue_resolve", "issue_reopen", "discussion_lock", "discussion_unlock", "discussion_delete", "discussion_restore",
		"discussion_post_delete", "discussion_post_restore", "nomination_reset", "nomination_reset_received",
		"genre_edit", "language_edit", "nsfw_toggle", "offset_edit", "tags_edit", "beatmap_owner_change"
	]
	/** Asking for those events makes the server return events of any types */
	const unavailable_events: osu.Beatmapset.Event["type"][] = ["discussion_lock", "discussion_unlock", "tags_edit"]
	const available_events = events.filter((e) => unavailable_events.indexOf(e) === -1)

	for (let i = 0; i < available_events.length; i++) {
		const split = available_events[i].split("_")
		const schema = "Beatmapset.Event." + (split.length > 1 ?
			split.reduce((a, c) => a.charAt(0).toUpperCase() + a.slice(1) + c.charAt(0).toUpperCase() + c.slice(1)) :
			split[0].charAt(0).toUpperCase() + split[0].slice(1))
		tests.push(new Test(api.getBeatmapsetEvents, [{}, [available_events[i]]], {events: schema, users: "User.WithGroups"}))
	}

	return tests
}

const testChangelog = () => [
	new Test(api.lookupChangelogBuild, [7156], "Changelog.Build.WithChangelogentriesVersions", {display_version: "2023.1008.1"}),
	new Test(api.getChangelogBuild, ["lazer", "2023.1008.1"], "Changelog.Build.WithChangelogentriesVersions", {id: 7156}),
	new Test(api.getChangelogBuilds, [undefined, {from: "2023.1031.0", to: 7184}, ["markdown"]], "Changelog.Build.WithUpdatestreamsChangelogentries",
		[(r: AR<typeof api.getChangelogBuilds>) => r.length === 4]),
	new Test(api.getChangelogStreams, [], "Changelog.UpdateStream.WithLatestbuildUsercount",
		[(r: AR<typeof api.getChangelogStreams>) => r.length > 2]),
]

const testComment = () => [
	new Test(api.getComment, [2418884], "Comment.Bundle",
		[(r: AR<typeof api.getComment>) => Boolean(r.users.find(((u) => u.id === 32573520)))]),
	new Test(api.getComments, [], "Comment.Bundle"),
	new Test(api.getComments, [{type: "beatmapset", id: 1971037}], "Comment.Bundle"),
	new Test(api.getComments, [{type: "build", id: 7463}], "Comment.Bundle"),
	new Test(api.getComments, [{type: "news_post", id: 1451}], "Comment.Bundle")
]

const testEvent = () => [
	new Test(api.getEvents, [], {events: "Event.Any"},
		[(r: AR<typeof api.getEvents>) => r.events.length === 50])
]

const testForum = () => [
	new Test(api.getForumTopicAndPosts, [1848236, {limit: 2}], {topic: "Forum.Topic", posts: "Forum.Post"},
		[(r: AR<typeof api.getForumTopicAndPosts>) => r.topic.title === "survey"])
]

const testHome = () => [
	new Test(api.searchUser, ["Tae", 2], {data: "User"},
		[(r: AR<typeof api.searchUser>) => r.data.length === 20]),
	new Test(api.searchWiki, ["Beat", 2], {data: "WikiPage"},
		[(r: AR<typeof api.searchWiki>) => r.data.length === 50])
]

const testMultiplayer = () => [
	// PLAYLIST
	new Test(api.getRoom, [588230], "Multiplayer.Room", {participant_count: 27}),
	new Test(api.getPlaylistItemScores, [{id: 5371540, room_id: 588230}], "Multiplayer.Room.PlaylistItem.Scores",
		[(r: AR<typeof api.getPlaylistItemScores>) => r.scores.length >= 9]),

	// REALTIME
	new Test(api.getRoom, [591993], "Multiplayer.Room",
		[(r: AR<typeof api.getRoom>) => r.recent_participants.length === 5]),
	new Test(api.getPlaylistItemScores, [{id: 5421279, room_id: 591993}], "Multiplayer.Room.PlaylistItem.Scores",
		[(r: AR<typeof api.getPlaylistItemScores>) => r.scores.length > 0]),

	// NON-LAZER
	new Test(api.getMatch, [62006076, {limit: 0}], "Multiplayer.Match",
		[(r: AR<typeof api.getMatch>) => r.match.name === "CWC2020: (Italy) vs (Indonesia)"]),
	new Test(api.getMatches, [{limit: 2}], "Multiplayer.Match.Info",
		[(r: AR<typeof api.getMatches>) => r[0].id > 111250329])
]

const testNews = () => [
	new Test(api.getNewsPost, [26], "NewsPost.WithContentNavigation",
		[(r: AR<typeof api.getNewsPost>) => r.title === "Official osu! Fanart Contest 5 Begins!"]),
	new Test(api.getNewsPosts, [], "NewsPost",
		[(r: AR<typeof api.getNewsPosts>) => r.length >= 1])
]

const testRanking = () => [
	new Test(api.getKudosuRanking, [], "User.WithKudosu",
		[(r: AR<typeof api.getKudosuRanking>) => r[0].kudosu.total > 10000]),
	new Test(api.getUserRanking, [osu.Ruleset.osu, "score", {country: "FR"}], "Ranking.User",
		[(r: AR<typeof api.getUserRanking>) => r.ranking[0].level.current > 106]),
	new Test(api.getCountryRanking, [osu.Ruleset.osu], "Ranking.Country",
		[(r: AR<typeof api.getCountryRanking>) => r.ranking[0].code === "US"]),
	new Test(api.getSpotlightRanking, [osu.Ruleset.taiko, 48], "Ranking.Spotlight",
		[(r: AR<typeof api.getSpotlightRanking>) => r.ranking[0].hit_accuracy === 97.85])
]

const testUser = () => [
	new Test(api.getUser, [7276846], "User.Extended", {id: 7276846}),
	new Test(api.lookupUsers, [[7276846, 2]], "User.WithCountryCoverGroups",
		[(r: AR<typeof api.lookupUsers>) => r.length === 2]),
	new Test(api.getUsers, [[7276846, 2]], "User.WithCountryCoverGroupsStatisticsrulesets",
		[(r: AR<typeof api.getUsers>) => r.length === 2]),

	new Test(api.getUserScores, [7276846, "best", undefined, {fails: false, lazer: true}, {limit: 5}], "Score.WithUserBeatmapBeatmapset",
		[(r: AR<typeof api.getUserScores>) => r.length === 5]),
	new Test(api.getUserScores, [6503700, "firsts", osu.Ruleset.taiko, undefined, {limit: 3}], "Score.WithUserBeatmapBeatmapset",
		[(r: AR<typeof api.getUserScores>) => r.length === 3]),
	new Test(api.getUserScores, [4568537, "recent", osu.Ruleset.fruits, {fails: true, lazer: true}, {limit: 1}], "Score.WithUserBeatmapBeatmapset",
		[(r: AR<typeof api.getUserScores>) => r.length === 1]),

	new Test(api.getUserBeatmaps, [7276846, "guest"], "Beatmapset.Extended.WithBeatmap",
		[(r: AR<typeof api.getUserBeatmaps>) => r.length === 1]),
	new Test(api.getUserMostPlayed, [7276846], "Beatmap.Playcount",
		[(r: AR<typeof api.getUserMostPlayed>) => r[0].beatmapset.title === "furioso melodia"]),
	new Test(api.getUserRecentActivity, [7562902, {limit: 25}], "Event.AnyRecentActivity",
		[(r: AR<typeof api.getUserRecentActivity>) => r.length <= 25]),
	new Test(api.getUserKudosu, [7276846, {limit: 5}], "User.KudosuHistory",
		[(r: AR<typeof api.getUserKudosu>) => r.length === 5]),
]

const testWiki = () => [
	new Test(api.getWikiPage, ["Rules"], "WikiPage", {title: "Rules"})
]

const testOther = () => [
	new Test(api.getSpotlights, [], "Spotlight",
		[(r: AR<typeof api.getSpotlights>) => r.length >= 132]),
	new Test(api.getSeasonalBackgrounds, [], undefined, [
		(r: AR<typeof api.getSeasonalBackgrounds>) => r.ends_at > new Date("2024-01-01"),
		(r: AR<typeof api.getSeasonalBackgrounds>) => r.backgrounds.length > 0
	])
]


const test = async (id: string, secret: string): Promise<void> => {
	api = await osu.API.createAsync({id: Number(id), secret}, undefined, {verbose: "all", timeout: 30}) //"http://127.0.0.1:8080")
	api.retry.on_timeout = true

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
		console.log("\n===>", tests[i].name)
		const smaller_tests = tests[i]()
		let test_pass = true

		for (let i = 0; i < smaller_tests.length; i++) {
			const result = await smaller_tests[i].try()
			if (result.passes.indexOf(false) != -1) {
				console.log(smaller_tests[i].fun.name, result.passes)
				test_pass = false
			}
		}

		results.push({test_name: tests[i].name, passed: test_pass})
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
