import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getNewsPost: Test = async(api) => {
	const post = await api.getNewsPost(26)
	expect(post.id).to.equal(26)
	expect(post.title).to.equal("Official osu! Fanart Contest 5 Begins!")
	expect(validate(post, "NewsPost.WithContentNavigation")).to.be.true
	return true
}

const getNewsPosts: Test = async(api) => {
	const posts = await api.getNewsPosts()
	expect(posts).to.have.length.greaterThan(0)
	expect(validate(posts, "NewsPost")).to.be.true
	return true
}

export const tests = [
	getNewsPost,
	getNewsPosts,
]
