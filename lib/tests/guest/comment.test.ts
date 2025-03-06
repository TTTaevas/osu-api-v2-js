import { API } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getComment: Test = async(api: API) => {
	const comment = await api.getComment(2418884)
	expect(Boolean(comment.users.find((user) => user.id === 32573520))).to.be.true
	expect(validate(comment, "Comment.Bundle")).to.be.true
	return true
}

const getComments: Test = async(api: API) => {
	const comments = await api.getComments()
	expect(validate(comments, "Comment.Bundle")).to.be.true

	console.log("|", "Beatmapset")
	const commentsBeatmapset = await api.getComments({type: "beatmapset", id: 1971037})
	expect(validate(commentsBeatmapset, "Comment.Bundle")).to.be.true

	console.log("|", "Build")
	const commentsBuild = await api.getComments({type: "build", id: 7463})
	expect(validate(commentsBuild, "Comment.Bundle")).to.be.true

	console.log("|", "NewsPost")
	const commentsNewspost = await api.getComments({type: "news_post", id: 1451})
	expect(validate(commentsNewspost, "Comment.Bundle")).to.be.true

	return true
}

export const tests = [
	getComment,
	getComments,
]
