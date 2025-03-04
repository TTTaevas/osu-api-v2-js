import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getComment = async(): Test => {
	const comment = await api.getComment(2418884)
	expect(Boolean(comment.users.find((user) => user.id === 32573520))).to.be.true
	expect(validate(comment, "Comment.Bundle"))
	return true
}

const getComments = async(): Test => {
	const comments = await api.getComments()
	expect(validate(comments, "Comment.Bundle"))

	console.log("|", "Beatmapset")
	const commentsBeatmapset = await api.getComments({type: "beatmapset", id: 1971037})
	expect(validate(commentsBeatmapset, "Comment.Bundle"))

	console.log("|", "Build")
	const commentsBuild = await api.getComments({type: "build", id: 7463})
	expect(validate(commentsBuild, "Comment.Bundle"))

	console.log("|", "NewsPost")
	const commentsNewspost = await api.getComments({type: "news_post", id: 1451})
	expect(validate(commentsNewspost, "Comment.Bundle"))

	return true
}

export const tests = [
	getComment,
	getComments,
]

export async function testComment(token: API["_access_token"]) {
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
