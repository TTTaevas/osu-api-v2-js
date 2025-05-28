import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getForum: Test = async(api) => {
	const response = await api.getForum(14)
	expect(response.forum.id).to.equal(14)
	expect(response.forum.name).to.equal("Ranked Beatmaps (Archived)")
	expect(response.forum.subforums).to.have.lengthOf(3)
	expect(response.pinned_topics).to.have.lengthOf(2)
	expect(response.topics).to.have.lengthOf(50)

	expect(validate(response.forum, "Forum.WithSubforums2")).to.be.true
	expect(validate(response.pinned_topics, "Forum.Topic")).to.be.true
	expect(validate(response.topics, "Forum.Topic")).to.be.true
	return true
}

const getForums: Test = async(api) => {
	const forums = await api.getForums()
	expect(forums).to.have.lengthOf(4)
	expect(validate(forums, "Forum.WithSubforums2")).to.be.true
	return true
}

const getForumTopic: Test = async(api) => {
	const response = await api.getForumTopic(1848236, {limit: 2})
	expect(response.cursor_string).to.be.a("string")
	expect(response.topic.id).to.equal(1848236)
	expect(validate(response.topic, "Forum.Topic")).to.be.true
	expect(validate(response.posts, "Forum.Post")).to.be.true
	return true
}

const getForumTopics: Test = async(api) => {
	const response = await api.getForumTopics({forum: 55})
	expect(response.cursor_string).to.be.a("string")
	expect(response.topics).to.have.lengthOf(50)
	response.topics.forEach((topic) => expect(topic.forum_id).to.equal(55))
	expect(validate(response.topics, "Forum.Topic")).to.be.true
	return true
}

export const tests = [
	getForum,
	getForums,
	getForumTopic,
	getForumTopics,
]
