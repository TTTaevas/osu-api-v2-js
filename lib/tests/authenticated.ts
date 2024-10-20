/**
 * The Authorization Code way
 * The token is considered by the API as myself
 */

import * as osu from "../index.js"
import "dotenv/config"
import util from "util"

import tsj from "ts-json-schema-generator"
import ajv from "ajv"

import promptSync from "prompt-sync"
import { exec } from "child_process"

let api: osu.API
const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true})
const prompt = promptSync({sigint: true})
const server: string = "https://dev.ppy.sh"

async function attempt<T extends (...args: any[]) => any>(fun: T, ...args: Parameters<T>): Promise<ReturnType<T> | false> {
	process.stdout.write(fun.name + ": ")
	try {
		const result = await fun.call(api, ...args)
		return result
	} catch(err) {
		console.error("❌ from attempt:\n", util.inspect(err, {colors: true, compact: true, depth: 100}), "\n\n")
		return false
	}
}

function meetsCondition(obj: any, condition: boolean) {
	if (condition === false) console.error("❌ from meetsCondition:\n", util.inspect(obj, {colors: true, compact: true, depth: 100}), "\n\n")
	return condition
}

// ajv will not work properly if type is not changed from string to object where format is date-time
function fixDate(x: any) {
	if (typeof x === "object" && x !== null) {
		if (x["format"] && x["format"] === "date-time" && x["type"] && x["type"] === "string") {
			x["type"] = "object"
		}

		const k = Object.keys(x)
		const v = Object.values(x)
		for (let i = 0; i < k.length; i++) {
			x[k[i]] = fixDate(v[i])
		}
	}

	return x
}

function validate(object: unknown, schemaName: string): boolean {
	try {
		const schema = fixDate(generator.createSchema(schemaName))
		const ajv_const = new ajv.default({strict: false})
		ajv_const.addFormat("date-time", true)
		const validator = ajv_const.compile(schema)

		if (Array.isArray(object)) {
			for (let i = 0; i < object.length; i++) {
				const result = validator(object[i])
				if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
					util.inspect(object[i], {colors: true, compact: true, depth: 100}), "\n\n")
				if (!result) return false
			}
			return true
		} else {
			const result = validator(object)
			if (validator.errors) console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
				util.inspect(object, {colors: true, compact: true, depth: 100}), "\n\n")
			return result
		}
	} catch(err) {
		console.log(err)
		return false
	}
}


// THE ACTUAL TESTS

const testChat = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> CHAT")

	const a = await attempt(api.getChatChannels)
	if (!a || !validate(a, "Chat.Channel")) okay = false

	if (a && a.length) {
		const channels = a.filter((c) => c.moderated === false) // make sure you can write in those channels
		const channel = channels[Math.floor(Math.random() * channels.length)]
		console.log("Testing on Chat.Channel", channel.name, "with id", channel.channel_id)

		const b = await attempt(api.joinChatChannel, channel)
		if (!b || !validate(b, "Chat.Channel.WithDetails")) okay = false
		const c = await attempt(api.getChatChannel, channel)
		if (!c || !validate(c, "Chat.Channel.WithDetails")) okay = false
		const d = await attempt(api.getChatMessages, channel)
		if (!d || !validate(d, "Chat.Message")) okay = false
		if (d && d.length) {
			const e = await attempt(api.markChatChannelAsRead, channel, d[0])
			if (e === false) okay = false
		}
		const f = await attempt(api.sendChatMessage, channel, "hello, just testing something")
		if (!f || !meetsCondition(f, f.content === "hello, just testing something") || !validate(f, "Chat.Message")) okay = false
		const g = await attempt(api.leaveChatChannel, channel)
		if (g === false) okay = false
	}

	const h = await attempt(api.createChatPrivateChannel, 3)
	if (!h || !validate(h, "Chat.Channel")) okay = false
	const i = await attempt(api.sendChatPrivateMessage, 3, "hello")
	if (!i || !meetsCondition(i, i.message.content === "hello") || !validate(i.channel, "Chat.Channel") || !validate(i.message, "Chat.Message")) okay = false
	if (h) {
		const j = await attempt(api.leaveChatChannel, h)
		if (j === false) okay = false
	}
	const k = await attempt(api.keepChatAlive)
	if (!k || !validate(k, "Chat.UserSilence")) okay = false

	return okay
}

const testForum = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> FORUM")
	const a = await attempt(api.createForumTopic, 85, "osu-api-v2-js test post", `Please ignore this forum post
It was automatically made for the sole purpose of testing [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]`,
	{title: "test poll", options: ["yes", "maybe", "no"], length_days: 14, vote_change: true})
	if (!a || !validate(a.topic, "Forum.Topic") && validate(a.post, "Forum.Post")) okay = false

	if (a) {
		const b = await attempt(api.editForumTopicTitle, a.topic, "osu-api-v2-js test post!")
		if (!b || !meetsCondition(b, b.title === "osu-api-v2-js test post!") || !validate(b, "Forum.Topic")) okay = false
		const c = await attempt(api.editForumPost, a.post, a.post.body.raw + " <3")
		if (!c || !meetsCondition(c, c.body.raw === a.post.body.raw + " <3") || !validate(c, "Forum.Post")) okay = false
	}

	return okay
}

const testMultiplayer = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> MULTIPLAYER")

	const a1 = await attempt(api.getRooms, "playlists", "all")
	if (!a1 || !validate(a1, "Multiplayer.Room")) okay = false
	const a2 = await attempt(api.getRooms, "realtime", "all")
	if (!a2 || !validate(a2, "Multiplayer.Room")) okay = false

	if (a1 && a1.length) {
		const b1 = await attempt(api.getRoomLeaderboard, a1[0])
		if (!b1 || !validate(b1.leaderboard, "Multiplayer.Room.Leader")) okay = false
	}
	if (a2 && a2.length) {
		const b2 = await attempt(api.getRoomLeaderboard, a2[0])
		if (!b2 || !validate(b2.leaderboard, "Multiplayer.Room.Leader")) okay = false
	}

	return okay
}

const testScore = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> SCORE")

	if (server !== "https://osu.ppy.sh") {
		console.log("Skipping, unable to do this test on this server")
		return true
	}

	const a = await attempt(api.getReplay, 393079484)
	if (!a || !meetsCondition(a, a.length === 119546)) okay = false
	return okay
}

const testUser = async (): Promise<boolean> => {
	let okay = true
	console.log("\n===> USER")

	const a = await attempt(api.getResourceOwner)
	if (!a || !validate(a, "User.Extended.WithStatisticsrulesets")) okay = false
	const b = await attempt(api.getFriends)
	if (!b || !validate(b, "User.WithCountryCoverGroupsStatisticsSupport")) okay = false

	return okay
}

const test = async (id: number | string | undefined, secret: string | undefined, redirect_uri: string | undefined): Promise<void> => {
	if (server === "https://osu.ppy.sh") console.warn("⚠️ DOING THE TESTS ON THE ACTUAL OSU SERVER")

	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri,
	["public", "chat.read", "chat.write", "chat.write_manage", "forum.write", "friends.read", "identify", "public"], server)
	exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)
	api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "all", server)

	const tests = [
		testChat,
		testForum,
		testMultiplayer,
		testScore,
		testUser
	]

	const results: {test_name: string, passed: boolean}[] = []
	for (let i = 0; i < tests.length; i++) {
		results.push({test_name: tests[i].name, passed: await tests[i]()})
	}
	console.log("\n", ...results.map((r) => `${r.test_name}: ${r.passed ? "✔️" : "❌"}\n`))
	await api.revokeToken()

	if (!results.find((r) => !r.passed)) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

const id = server === "https://osu.ppy.sh" ? process.env.ID : process.env.DEV_ID
const secret = server === "https://osu.ppy.sh" ? process.env.SECRET : process.env.DEV_SECRET
test(id, secret, process.env.REDIRECT_URI)
