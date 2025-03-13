import { Forum } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

let test_topic: Forum.Topic | undefined
let test_post: Forum.Post | undefined

const createForumTopic: Test = async(api) => {
	const response = await api.createForumTopic(85, "osu-api-v2-js test post", `Please ignore this forum post
It was automatically made for the sole purpose of testing [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]`,
						{title: "test poll", options: ["yes", "maybe", "no"], length_days: 14, vote_change: true})

	expect(response.topic.forum_id).to.equal(85)
	expect(response.topic.user_id).to.equal(api.user)
	expect(response.topic.title).to.equal("osu-api-v2-js test post")
	expect(response.topic.poll?.title.bbcode).to.equal("test poll")
	expect(response.topic.poll?.allow_vote_change).to.equal(true)
	expect(validate(response.topic, "Forum.Topic")).to.be.true

	expect(response.post.forum_id).to.equal(85)
	expect(response.post.topic_id).to.equal(response.topic.id)
	expect(response.post.user_id).to.equal(api.user)
	expect(validate(response.post, "Forum.Post")).to.be.true

	test_topic = response.topic
	console.log("| Further Forum tests will be made on Forum.Topic", test_topic.title, "with id", test_topic.id)
	test_post = response.post
	console.log("| As well as on Forum.Post with id", test_post.id)
	return true
}

const editForumTopicTitle: Test = async(api) => {
	const topic = await api.editForumTopicTitle(test_topic!, "osu-api-v2-js test post!")
	expect(topic.forum_id).to.equal(85)
	expect(topic.user_id).to.equal(api.user)
	expect(topic.title).to.equal("osu-api-v2-js test post!")
	expect(topic.poll?.title.bbcode).to.equal("test poll")
	expect(topic.poll?.allow_vote_change).to.equal(true)
	expect(validate(topic, "Forum.Topic")).to.be.true
	return true
}

const editForumPost: Test = async(api) => {
	const post = await api.editForumPost(test_post!, test_post!.body.raw.concat(" <3"))
	expect(post.forum_id).to.equal(85)
	expect(post.user_id).to.equal(api.user)
	expect(post.body.raw).to.equal(test_post!.body.raw.concat(" <3"))
	expect(validate(post, "Forum.Post")).to.be.true
	return true
}

export const tests = [
	createForumTopic,
	editForumTopicTitle,
	editForumPost,
]
