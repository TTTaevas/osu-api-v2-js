import { API, Beatmapset } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const searchBeatmapsets = async(): Test => {
	const response = await api.searchBeatmapsets({categories: "Any"})
	expect(response.error).to.be.null
	expect(response.recommended_difficulty).to.be.null
	expect(response.cursor_string).to.be.a("string")
	expect(response.total).to.be.greaterThanOrEqual(10000)
	expect(validate(response.beatmapsets, "Beatmapset.Extended.WithBeatmapPacktags")).to.be.true
	return true
}

const lookupBeatmapset = async(): Test => {
	const beatmapset = await api.lookupBeatmapset(388463)
	expect(beatmapset.id).to.equal(58951)
	expect(validate(beatmapset, "Beatmapset.Extended.Plus")).to.be.true
	return true
}

const getBeatmapset = async(): Test => {
	const beatmapset = await api.getBeatmapset(1971037)
	expect(beatmapset.id).to.equal(1971037)
	expect(beatmapset.submitted_date?.toISOString().substring(0, 10)).to.equal("2023-04-07")
	expect(validate(beatmapset, "Beatmapset.Extended.Plus")).to.be.true
	return true
}

const getBeatmapsetDiscussions = async(): Test => {
	const response = await api.getBeatmapsetDiscussions({beatmapset: 2119925})
	expect(response.beatmapsets.at(0)?.id).to.equal(2119925)
	expect(validate(response.beatmaps, "Beatmap.Extended")).to.be.true
	expect(validate(response.beatmapsets, "Beatmapset.Extended")).to.be.true
	expect(validate(response.users, "User.WithGroups")).to.be.true
	expect(validate(response.discussions, "Beatmapset.Discussion.WithStartingpost")).to.be.true
	expect(validate(response.included_discussions, "Beatmapset.Discussion.WithStartingpost")).to.be.true
	return true
}

const getBeatmapsetDiscussionPosts = async(): Test => {
	const response = await api.getBeatmapsetDiscussionPosts({discussion: 4143461})
	expect(validate(response.beatmapsets, "Beatmapset.WithHype")).to.be.true
	expect(validate(response.users, "User")).to.be.true
	expect(validate(response.posts, "Beatmapset.Discussion.Post")).to.be.true
	return true
}

const getBeatmapsetDiscussionVotes = async(): Test => {
	const response = await api.getBeatmapsetDiscussionVotes({vote_receiver: 7276846})
	expect(validate(response.users, "User.WithGroups")).to.be.true
	expect(validate(response.discussions, "Beatmapset.Discussion")).to.be.true
	expect(validate(response.votes, "Beatmapset.Discussion.Vote")).to.be.true
	return true
}

const getBeatmapsetEvents = async(): Test => {
	const events: Beatmapset.Event["type"][] = [
		"nominate", "love", "remove_from_loved", "qualify", "disqualify", "approve", "rank",
		"kudosu_allow", "kudosu_deny", "kudosu_gain", "kudosu_lost", "kudosu_recalculate",
		"issue_resolve", "issue_reopen", "discussion_lock", "discussion_unlock", "discussion_delete", "discussion_restore",
		"discussion_post_delete", "discussion_post_restore", "nomination_reset", "nomination_reset_received",
		"genre_edit", "language_edit", "nsfw_toggle", "offset_edit", "tags_edit", "beatmap_owner_change"
	]
	/** Asking for those events makes the server return events of any types */
	const unavailable_events: Beatmapset.Event["type"][] = ["discussion_lock", "discussion_unlock", "tags_edit"]
	const available_events = events.filter((e) => unavailable_events.indexOf(e) === -1)

	for (let i = 0; i < available_events.length; i++) {
		const split = available_events[i].split("_")
		const schema = "Beatmapset.Event." + (split.length > 1 ?
			split.reduce((a, c) => a.charAt(0).toUpperCase() + a.slice(1) + c.charAt(0).toUpperCase() + c.slice(1)) :
			split[0].charAt(0).toUpperCase() + split[0].slice(1))
		console.log("|", schema)

		const response = await api.getBeatmapsetEvents(undefined, [available_events[i]])
		expect(validate(response.users, "User.WithGroups")).to.be.true
		expect(validate(response.events, schema)).to.be.true
	}

	return true
}

export const tests = [
	searchBeatmapsets,
	lookupBeatmapset,
	getBeatmapset,
	getBeatmapsetDiscussions,
	getBeatmapsetDiscussionPosts,
	getBeatmapsetDiscussionVotes,
	getBeatmapsetEvents,
]

export async function testBeatmapset(token: API["_access_token"]) {
	api.access_token = token
	for (let i = 0; i < tests.length; i++) {
		try {
			console.log(tests[i].name)
			await tests[i]()
		} catch(e) {
			console.error(e)
			return false
		}
	}
	return true
}
