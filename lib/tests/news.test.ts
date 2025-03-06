import { API } from "../index.js"
import { expect } from "chai"
import { validate, Test } from "./exports.js"

let api: API = new API({retry_on_timeout: true})

const getNewsPost = async(): Test => {
	const post = await api.getNewsPost(26)
	expect(post.id).to.equal(26)
	expect(post.title).to.equal("Official osu! Fanart Contest 5 Begins!")
	expect(validate(post, "NewsPost.WithContentNavigation")).to.be.true
	return true
}

const getNewsPosts = async(): Test => {
	const posts = await api.getNewsPosts()
	expect(posts).to.have.length.greaterThan(0)
	expect(validate(posts, "NewsPost")).to.be.true
	return true
}

export const tests = [
	getNewsPost,
	getNewsPosts,
]

export async function testNews(token: API["_access_token"]) {
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
