import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getForumTopicAndPosts = async(): Test => {
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

export async function testForum(token: API["_access_token"]) {
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
