import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getForumTopicAndPosts: Test = async(api) => {
	const response = await api.getForumTopicAndPosts(1848236, {limit: 2})
	expect(response.cursor_string).to.be.a("string")
	expect(response.topic.id).to.equal(1848236)
	expect(validate(response.topic, "Forum.Topic")).to.be.true
	expect(validate(response.posts, "Forum.Post")).to.be.true
	return true
}

export const tests = [
	getForumTopicAndPosts,
]
