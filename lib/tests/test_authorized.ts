/**
 * The Authorization Code way
 * The token is considered by the API as myself
 */

import "dotenv/config"
import * as osu from "../index.js"
import promptSync from "prompt-sync"
import { exec } from "child_process"
import util from "util"
import { PollConfig } from "../forum.js"

const prompt = promptSync({sigint: true})
const server = "https://dev.ppy.sh"

function sleep(seconds: number) {
	return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri, ["public", "forum.write"], server)
	exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)
	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "all", server)
	
	// Consider making a poll interface!
	let poll: PollConfig = {
		title: "decide now!",
		options: ["yeah", "yes"],
		length_days: 0,
		max_options: 1,
		vote_change: false,
		hide_results: false
	}

	try {
		// let post = await api.createForumTopic(74, "furioso melodia",
		// "it's really important!\nthis post was made to test [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]", poll)
		// console.log(util.inspect(post, {colors: true, depth: Infinity}))
		// await sleep(20)

		// ----

		// let post = {post: {id: 508}, topic: {id: 397}}
	
		// let title_edit = await api.editForumTopicTitle(post.topic, "is furioso melodia a good beatmap")
		// console.log(util.inspect(title_edit, {colors: true, depth: Infinity}))
		// await sleep(20)
	
		// let content_edit = await api.editForumPost(post.post, `[header]you agree with me, right?[/header]\nthis post was made to test [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]\ncome check it out!`)
		// console.log(util.inspect(content_edit, {colors: true, depth: Infinity}))
		// await sleep(20)

		// ----

		let topic = {id: 133}

		let check = await api.getForumTopicAndPosts(topic)
		console.log(util.inspect(check, {colors: true, depth: Infinity}))
	
		let reply = await api.replyForumTopic(topic, "did you know: furioso melodia is a good map")
		console.log(util.inspect(reply, {colors: true, depth: Infinity}))
		await sleep(20)
	
		let check_again = await api.getForumTopicAndPosts(topic)
		console.log(util.inspect(check_again, {colors: true, depth: Infinity}))
	} catch(err) {
		console.log(err)
	}

}

test(process.env.DEV_ID, process.env.DEV_SECRET, process.env.REDIRECT_URI)
