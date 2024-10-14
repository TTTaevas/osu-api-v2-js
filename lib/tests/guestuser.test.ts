/**
 * The Client Credentials way
 * The token is considered by the API as a guest user
 * https://osu.ppy.sh/docs/#client-credentials-grant
 */

import "dotenv/config"
import * as osu from "../index.js"
import { afterAll, beforeAll, describe, expect, expectTypeOf, test } from "vitest"

if (process.env.ID === undefined) {throw new Error("❌ The ID has not been defined in the environment variables!")}
if (process.env.SECRET === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}

let api: osu.API
const id: number = Number(process.env.ID)
const secret: string = process.env.SECRET


beforeAll(async () => {
	api = await osu.API.createAsync({id, secret}, undefined, "all") //"http://127.0.0.1:8080")
	api.timeout = 30
	api.verbose = "errors"
})

afterAll(async () => {
	api.verbose = "all"
	await api.revokeToken()
})

describe("BeatmapPack stuff", () => {
	test("getBeatmapPack", async () => {
		const pack = await api.getBeatmapPack("P217")
		expect(pack.tag).toBe("P217")
		expectTypeOf(pack).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapPack>>>()
	})
	
	test("getBeatmapPacks", async () => {
		const packs = await api.getBeatmapPacks("tournament")
		expect(packs.beatmap_packs.length).greaterThanOrEqual(100)
		expectTypeOf(packs).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapPacks>>>()
	})
})

describe("Beatmap stuff", () => {
	const id = 388463

	test("lookupBeatmap", async () => {
		const beatmap = await api.lookupBeatmap({id})
		expect(beatmap.id).toBe(id)
		expectTypeOf(beatmap).toEqualTypeOf<Awaited<ReturnType<typeof api.lookupBeatmap>>>()
	})

	test("getBeatmap", async () => {
		const beatmap = await api.getBeatmap(id)
		expect(beatmap.beatmapset.title_unicode).toBe("夜啼く兎は夢を見る")
		expectTypeOf(beatmap).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmap>>>()
	})

	test("getBeatmaps", async () => {
		const beatmaps = await api.getBeatmaps([id, 4089655])
		expect(beatmaps).toHaveLength(2)
		expectTypeOf(beatmaps).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmaps>>>()
	})

	test("getBeatmapDifficultyAttributesOsu", async () => {
		const attributes = await api.getBeatmapDifficultyAttributesOsu(125660, ["DT"])
		expect(attributes.approach_rate.toFixed(2)).toBe("9.67")
		expectTypeOf(attributes).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapDifficultyAttributesOsu>>>()
	})

	test("getBeatmapDifficultyAttributesTaiko", async () => {
		const attributes = await api.getBeatmapDifficultyAttributesTaiko(id, ["DT"])
		expect(attributes.great_hit_window).lessThan(35)
		expectTypeOf(attributes).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapDifficultyAttributesTaiko>>>()
	})

	test("getBeatmapDifficultyAttributesFruits", async () => {
		const attributes = await api.getBeatmapDifficultyAttributesFruits(705339, ["DT"])
		expect(attributes.approach_rate.toFixed(2)).toBe("10.33")
		expectTypeOf(attributes).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapDifficultyAttributesFruits>>>()
	})

	test("getBeatmapDifficultyAttributesMania", async () => {
		const attributes = await api.getBeatmapDifficultyAttributesMania(3980252, ["DT"])
		expect(attributes.great_hit_window).toBe(40)
		expectTypeOf(attributes).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapDifficultyAttributesMania>>>()
	})

	test("lookupBeatmapset", async () => {
		const beatmapset = await api.lookupBeatmapset(id)
		expect(beatmapset.id).toBe(58951)
		expectTypeOf(beatmapset).toEqualTypeOf<Awaited<ReturnType<typeof api.lookupBeatmapset>>>()
	})

	test("searchBeatmapsets", async () => {
		const search = await api.searchBeatmapsets({categories: "Any"})
		expect(search.total).greaterThanOrEqual(10000)
		expectTypeOf(search).toEqualTypeOf<Awaited<ReturnType<typeof api.searchBeatmapsets>>>()
	})

	test("getBeatmapUserScore", async () => {
		const userScore = await api.getBeatmapUserScore(176960, 7276846, {mods: ["NM"]})
		expect(userScore.score.accuracy).lessThan(0.99)
		expectTypeOf(userScore).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapUserScore>>>()
	})

	test("getBeatmapUserScores", async () => {
		const userScores = await api.getBeatmapUserScores(203993, 7276846, {ruleset: osu.Ruleset.fruits})
		expect(userScores).toHaveLength(1)
		expectTypeOf(userScores).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapUserScores>>>()
	})

	test("getBeatmapScores", async () => {
		const scores = await api.getBeatmapScores(129891, {legacy_only: true})
		expect(scores[0].score).toBe(132408001)
		expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapScores>>>()
	})

	test("getBeatmapSoloScores", async () => {
		const scores = await api.getBeatmapSoloScores(129891)
		expect(scores[0].total_score).greaterThanOrEqual(1073232).and.lessThan(2000000)
		expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapSoloScores>>>()
	})
})

describe("BeatmapsetDiscussion stuff", () => {
	test("getBeatmapsetDiscussions", async () => {
		const discussions = await api.getBeatmapsetDiscussions({beatmapset: 2119925})
		expectTypeOf(discussions).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapsetDiscussions>>>()
	})

	test("getBeatmapsetDiscussionPosts", async () => {
		const discussions = await api.getBeatmapsetDiscussionPosts({discussion: 4143461})
		expectTypeOf(discussions).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapsetDiscussionPosts>>>()
	})

	test("getBeatmapsetDiscussionVotes", async () => {
		const discussions = await api.getBeatmapsetDiscussionVotes({vote_receiver: 7276846})
		expectTypeOf(discussions).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapsetDiscussionVotes>>>()
	})
})

describe("Beatmapset stuff", () => {
	test("getBeatmapset", async () => {
		const beatmapset = await api.getBeatmapset(1971037)
		expect(beatmapset.submitted_date?.toISOString().substring(0, 10)).toBe("2023-04-07")
		expectTypeOf(beatmapset).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapset>>>()
	})

	test("getBeatmapsetEvents", async () => {
		const events = await api.getBeatmapsetEvents()
		expectTypeOf(events).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapsetEvents>>>()
	})

	test.each([
		"nominate", "love", "remove_from_loved", "qualify", "disqualify", "approve", "rank",
		"kudosu_allow", "kudosu_deny", "kudosu_gain", "kudosu_lost", "kudosu_recalculate",
		"issue_resolve", "issue_reopen", "discussion_lock", "discussion_unlock", "discussion_delete", "discussion_restore",
		"discussion_post_delete", "discussion_post_restore", "nomination_reset", "nomination_reset_received",
		"genre_edit", "language_edit", "nsfw_toggle", "offset_edit", "tags_edit", "beatmap_owner_change"
	] as osu.Beatmapset.Event["type"][])("getBeatmapsetEvents, %s", async (event_type) => {
		const events = await api.getBeatmapsetEvents({}, [event_type])
		if (!events.events.length) console.log(`⚠️ (getBeatmapsetEvents) The "${event_type}" event_type has no EVENTS`)
		if (!events.users.length) console.log(`⚠️ (getBeatmapsetEvents) The "${event_type}" event_type has no USERS`)
		expectTypeOf(events).toEqualTypeOf<Awaited<ReturnType<typeof api.getBeatmapsetEvents>>>()
	})
})

describe("Changelog stuff", () => {
	test("lookupChangelogBuild", async () => {
		const build = await api.lookupChangelogBuild(7156)
		expect(build.display_version).toBe("2023.1008.1")
		expectTypeOf(build).toEqualTypeOf<Awaited<ReturnType<typeof api.lookupChangelogBuild>>>()
	})

	test("getChangelogBuild", async () => {
		const build = await api.getChangelogBuild("lazer", "2023.1008.1")
		expect(build.id).toBe(7156)
		expectTypeOf(build).toEqualTypeOf<Awaited<ReturnType<typeof api.getChangelogBuild>>>()
	})

	test("getChangelogBuilds", async () => {
		const builds = await api.getChangelogBuilds(undefined, {from: "2023.1031.0", to: 7184}, ["markdown"])
		expect(builds).toHaveLength(4)
		expectTypeOf(builds).toEqualTypeOf<Awaited<ReturnType<typeof api.getChangelogBuilds>>>()
	})

	test("getChangelogStreams", async () => {
		const streams = await api.getChangelogStreams()
		expect(streams.length).greaterThan(2)
		expectTypeOf(streams).toEqualTypeOf<Awaited<ReturnType<typeof api.getChangelogStreams>>>()
	})
})

describe("Comment stuff", () => {
	test("getComment", async () => {
		const comment = await api.getComment(2418884)
		expect(comment.users.find(((u) => u.id === 32573520))).toBeTruthy()
		expectTypeOf(comment).toEqualTypeOf<Awaited<ReturnType<typeof api.getComment>>>()
	})

	test("getComments", async () => {
		const comments = await api.getComments()
		expectTypeOf(comments).toEqualTypeOf<Awaited<ReturnType<typeof api.getComments>>>()
	})

	test("getComments, beatmapset", async () => {
		const comments = await api.getComments({type: "beatmapset", id: 1971037})
		expectTypeOf(comments).toEqualTypeOf<Awaited<ReturnType<typeof api.getComments>>>()
	})

	test("getComments, build", async () => {
		const comments = await api.getComments({type: "build", id: 7463})
		expectTypeOf(comments).toEqualTypeOf<Awaited<ReturnType<typeof api.getComments>>>()
	})

	test("getComments, news_post", async () => {
		const comments = await api.getComments({type: "news_post", id: 1451})
		expectTypeOf(comments).toEqualTypeOf<Awaited<ReturnType<typeof api.getComments>>>()
	})
})

describe("Event stuff", () => {
	test("getEvents", async () => {
		const events = await api.getEvents()
		expect(events.events).toHaveLength(50)
		expectTypeOf(events).toEqualTypeOf<Awaited<ReturnType<typeof api.getEvents>>>()
	})
})

describe("Forum stuff", () => {
	test("getForumTopicAndPosts", async () => {
		const collection = await api.getForumTopicAndPosts(1848236, {limit: 2})
		expect(collection.topic).toHaveProperty("title", "survey")
		expectTypeOf(collection).toEqualTypeOf<Awaited<ReturnType<typeof api.getForumTopicAndPosts>>>()
	})
})

describe("Home stuff", () => {
	test("searchUser", async () => {
		const search = await api.searchUser("Tae")
		expect(search.data).toHaveLength(20)
		expectTypeOf(search).toEqualTypeOf<Awaited<ReturnType<typeof api.searchUser>>>()
	})

	test("searchWiki", async () => {
		const search = await api.searchWiki("Beat")
		expect(search.data).toHaveLength(50)
		expectTypeOf(search).toEqualTypeOf<Awaited<ReturnType<typeof api.searchWiki>>>()
	})
})

describe("Multiplayer stuff", () => {
	describe("Realtime rooms", () => {
		let room: osu.Multiplayer.Room
		test("getRoom", async () => {
			room = await api.getRoom(591993)
			expect(room.recent_participants).toHaveLength(5)
			expectTypeOf(room).toEqualTypeOf<Awaited<ReturnType<typeof api.getRoom>>>()
		})

		test("getPlaylistItemScores", async () => {
			const scores = await api.getPlaylistItemScores({id: room.playlist[0].id, room_id: room.id})
			expect(scores.scores.length).greaterThan(0)
			expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getPlaylistItemScores>>>()
		})
	})

	describe("Playlists rooms", () => {
		let room: osu.Multiplayer.Room
		test("getRoom", async () => {
			room = await api.getRoom(588230)
			expect(room.participant_count).toBe(27)
			expectTypeOf(room).toEqualTypeOf<Awaited<ReturnType<typeof api.getRoom>>>()
		})

		test("getPlaylistItemScores", async () => {
			const scores = await api.getPlaylistItemScores({id: room.playlist[0].id, room_id: room.id})
			expect(scores.scores.length).greaterThanOrEqual(9)
			expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getPlaylistItemScores>>>()
		})
	})

	test("getMatch", async () => {
		const match = await api.getMatch(62006076, {limit: 0})
		expect(match.match.name).toBe("CWC2020: (Italy) vs (Indonesia)")
		expectTypeOf(match).toEqualTypeOf<Awaited<ReturnType<typeof api.getMatch>>>()
	})

	test("getMatches", async () => {
		const matches = await api.getMatches({limit: 2})
		expect(matches[0].id).greaterThan(111250329)
		expectTypeOf(matches).toEqualTypeOf<Awaited<ReturnType<typeof api.getMatches>>>()
	})
})

describe("News stuff", () => {
	test("getNewsPost", async () => {
		const post = await api.getNewsPost(26)
		expect(post).toHaveProperty("title", "Official osu! Fanart Contest 5 Begins!")
		expectTypeOf(post).toEqualTypeOf<Awaited<ReturnType<typeof api.getNewsPost>>>()
	})

	test("getNewsPosts", async () => {
		const posts = await api.getNewsPosts()
		expect(posts.length).greaterThanOrEqual(1)
		expectTypeOf(posts).toEqualTypeOf<Awaited<ReturnType<typeof api.getNewsPosts>>>()
	})
})

describe("Ranking stuff", () => {
	test("getKudosuRanking", async () => {
		const ranking = await api.getKudosuRanking()
		expect(ranking[0].kudosu.total).greaterThan(10000)
		expectTypeOf(ranking).toEqualTypeOf<Awaited<ReturnType<typeof api.getKudosuRanking>>>()
	})

	test("getUserRanking", async () => {
		const users = await api.getUserRanking(osu.Ruleset.osu, "score", {country: "FR"})
		expect(users.ranking[0].level.current).greaterThan(106)
		expectTypeOf(users).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserRanking>>>()
	})

	test("getCountryRanking", async () => {
		const countries = await api.getCountryRanking(osu.Ruleset.osu)
		expect(countries.ranking[0].code).toBe("US")
		expectTypeOf(countries).toEqualTypeOf<Awaited<ReturnType<typeof api.getCountryRanking>>>()
	})

	test("getSpotlightRanking", async () => {
		const spotlight = await api.getSpotlightRanking(osu.Ruleset.taiko, 48)
		expect(spotlight.ranking[0].hit_accuracy).toBe(97.85)
		expectTypeOf(spotlight).toEqualTypeOf<Awaited<ReturnType<typeof api.getSpotlightRanking>>>()
	})
})

describe("User stuff", () => {
	const id = 7276846

	test("getUser", async () => {
		const user = await api.getUser(id)
		expect(user.id).toBe(id)
		expectTypeOf(user).toEqualTypeOf<Awaited<ReturnType<typeof api.getUser>>>()
	})

	test("lookupUsers", async () => {
		const users = await api.lookupUsers([id, 2])
		expect(users).toHaveLength(2)
		expectTypeOf(users).toEqualTypeOf<Awaited<ReturnType<typeof api.lookupUsers>>>()
	})

	test("getUsers", async () => {
		const users = await api.getUsers([id, 2])
		expect(users).toHaveLength(2)
		expectTypeOf(users).toEqualTypeOf<Awaited<ReturnType<typeof api.getUsers>>>()
	})

	test("getUserScores, best", async () => {
		const scores = await api.getUserScores(id, "best", undefined, {fails: false, lazer: true}, {limit: 5})
		expect(scores).toHaveLength(5)
		expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserScores>>>()
	})

	test("getUserScores, firsts", async () => {
		const scores = await api.getUserScores(6503700, "firsts", osu.Ruleset.taiko, undefined, {limit: 3})
		expect(scores).toHaveLength(3)
		expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserScores>>>()
	})

	// Due to the nature of this test, it might fail, you may adapt the user id
	test("getUserScores, recent", async () => {
		const scores = await api.getUserScores(9269034, "recent", osu.Ruleset.osu, {fails: true, lazer: true}, {limit: 1})
		expect(scores).toHaveLength(1)
		expectTypeOf(scores).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserScores>>>()
	})

	test("getUserBeatmaps", async () => {
		const beatmapsets = await api.getUserBeatmaps(id, "guest")
		expect(beatmapsets).toHaveLength(1)
		expectTypeOf(beatmapsets).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserBeatmaps>>>()
	})

	test("getUserMostPlayed", async () => {
		const beatmaps = await api.getUserMostPlayed(id)
		expect(beatmaps[0].beatmapset).toHaveProperty("title", "furioso melodia")
		expectTypeOf(beatmaps).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserMostPlayed>>>()
	})

	test("getUserRecentActivity", async () => {
		const activity = await api.getUserRecentActivity(7562902, {limit: 25})
		expect(activity.length).lessThanOrEqual(25)
		expectTypeOf(activity).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserRecentActivity>>>()
	})

	test("getUserKudosu", async () => {
		const history = await api.getUserKudosu(id, {limit: 5})
		expect(history).toHaveLength(5)
		expectTypeOf(history).toEqualTypeOf<Awaited<ReturnType<typeof api.getUserKudosu>>>()
	})
})

describe("Wiki stuff", () => {
	test("getWikiPage", async () => {
		const page = await api.getWikiPage("Rules")
		expect(page).toHaveProperty("title", "Rules")
		expectTypeOf(page).toEqualTypeOf<Awaited<ReturnType<typeof api.getWikiPage>>>()
	})
})

describe("Other stuff", () => {
	test("getSpotlights", async () => {
		const spotlights = await api.getSpotlights()
		expect(spotlights.length).greaterThanOrEqual(132)
		expectTypeOf(spotlights).toEqualTypeOf<Awaited<ReturnType<typeof api.getSpotlights>>>()
	})

	test("getSeasonalBackgrounds", async () => {
		const season = await api.getSeasonalBackgrounds()
		expect(season.ends_at).greaterThan(new Date("2024-01-01"))
		expect(season.backgrounds.length).greaterThan(0)
		expectTypeOf(season).toEqualTypeOf<Awaited<ReturnType<typeof api.getSeasonalBackgrounds>>>()
	})
})
