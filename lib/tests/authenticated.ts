/**
 * The Authorization Code way
 * The token is considered by the API as a user (myself)
 * https://osu.ppy.sh/docs/#authorization-code-grant
 */

import * as osu from "../index.js"
import "dotenv/config"
import util from "util"

import tsj from "ts-json-schema-generator"
import ajv from "ajv"

import { exec } from "child_process"
import http from "http"

if (process.env.REDIRECT_URI === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}
const generator = tsj.createGenerator({path: "lib/index.ts", additionalProperties: true})
const redirect_uri: string = process.env.REDIRECT_URI
const server: string = "https://dev.ppy.sh"
let api: osu.API
let id: number
let secret: string

if (server === "https://osu.ppy.sh") {
	console.warn("⚠️ DOING THE TESTS ON THE ACTUAL OSU SERVER")
	if (process.env.ID === undefined) {throw new Error("❌ The ID has not been defined in the environment variables!")}
	if (process.env.SECRET === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}
	id = Number(process.env.ID)
	secret = process.env.SECRET
} else {
	if (process.env.DEV_ID === undefined) {throw new Error("❌ The DEV_ID has not been defined in the environment variables!")}
	if (process.env.DEV_SECRET === undefined) {throw new Error("❌ The DEV_SECRET has not been defined in the environment variables!")}
	id = Number(process.env.DEV_ID)
	secret = process.env.DEV_SECRET
}

async function getCode(url: string): Promise<string> {
	const httpserver = http.createServer()
	const host = redirect_uri.substring(redirect_uri.indexOf("/") + 2, redirect_uri.lastIndexOf(":"))
	const port = Number(redirect_uri.substring(redirect_uri.lastIndexOf(":") + 1).split("/")[0])
	httpserver.listen({host, port})

	console.log("Waiting for code...")
	const command = (process.platform == "darwin" ? "open" : process.platform == "win32" ? "start" : "xdg-open")
	exec(`${command} "${url}"`)

	const code: string = await new Promise((resolve) => {
		httpserver.on("request", (request, response) => {
			if (request.url) {
				console.log("Received code!")
				response.end("Worked! You may now close this tab.", "utf-8")
				httpserver.close()
				resolve(request.url.substring(request.url.indexOf("code=") + 5))
			}
		})
	})
	return code
}

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
				if (validator.errors) {
					if (validator.errors.filter((r) => r.instancePath !== "/cover/url").length) {
						console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
							util.inspect(object[i], {colors: true, compact: true, depth: 100}), "\n\n")
					} else {
						// dev server provides no default covers, normal server makes it impossible to have no covers
						console.log("The User's cover.url was wrong, ignoring as it's half-intended")
						return true
					}
				}
				
				if (!result) return false
			}
			return true
		} else {
			const result = validator(object)
			if (validator.errors) {
				if (validator.errors.filter((r) => r.instancePath !== "/cover/url").length) {
					console.error("❌ from validator:\n", validator.errors, "\n...for the following object:\n",
						util.inspect(object, {colors: true, compact: true, depth: 100}), "\n\n")
				} else {
					// dev server provides no default covers, normal server makes it impossible to have no covers
					console.log("The User's cover.url was wrong, ignoring as it's half-intended")
					return true
				}
			}
			return result
		}
	} catch(err) {
		console.log(err)
		return false
	}
}

type AR<T extends (...args: any) => any> = Awaited<ReturnType<T>>;

class Test<
	F extends (...args: any[]) => Promise<T>,
	T,
	P extends Partial<AR<F>>
> {
	fun: F
	args: Parameters<F>
	schema?: string | {[key in keyof P]: string} | false
	conditions?: P | ((arg0: T) => boolean)[]
	response: T | false = false

	constructor(fun: F, args: Parameters<F>, schema?: string | {[key in keyof P]: string} | false, conditions?: P | ((arg0: T) => boolean)[]) {
		this.fun = fun
		this.args = args
		this.schema = schema
		this.conditions = conditions
	}

	async try() {
		const pure_response = await attempt(this.fun, ...this.args)
        const response = pure_response as {[k: string]: any}

		// if we expected no object as a response, just don't test beyond sending the request
		if (this.schema === false) return {passes: [true, true, true], response: response}

		let validation_pass = Boolean(response)
		let condition_pass = true
		if (pure_response && response) {
			
			if (typeof this.schema === "string") {
				validation_pass = validate(response, this.schema)
			} else if (this.schema) {
				for (let i = 0; i < Object.keys(this.schema).length; i++) {
					validation_pass = !validation_pass ? false : validate(response[Object.keys(this.schema)[i]], Object.values(this.schema)[i] as string)
				}
			}

			if (validation_pass) {

				if (Array.isArray(this.conditions)) {
					for (let i = 0; i < this.conditions.length; i++) {
						const condition = this.conditions[i]
						if (!condition(pure_response)) {
							console.error("❌ from condition checking:\n",
							`It seems like the anonymous function index ${i} failed...\n`,
							`(for the following object)\n`,
							util.inspect(pure_response, {colors: true, compact: true, depth: 3}), "\n\n")
							condition_pass = false
						}
					}
				} else {
					for (let property in this.conditions) {
						if (!(property in response) || response[property] !== this.conditions[property]) {
							console.error("❌ from condition checking:\n",
							`It seems like something is wrong with the property: ${property}\n`,
							`Expected ${this.conditions[property]}\n`,
							`Instead got ${response[property]} (for the following object)\n`,
							util.inspect(response, {colors: true, compact: true, depth: 1}), "\n\n")
							condition_pass = false
						}
					}
				}
			} else {condition_pass = false}
		} else {condition_pass = false}

		this.response = pure_response
		return {passes: [Boolean(response), validation_pass, condition_pass], response: response}
    }
}


// THE ACTUAL TESTS

const testChat = async () => {
	const tests: Test<any, any, any>[] = []
	const chat_test = new Test(api.getChatChannels, [], "Chat.Channel")
	await chat_test.try()

	if (chat_test.response && (chat_test.response as osu.Chat.Channel[]).length) {
		const chats = chat_test.response as osu.Chat.Channel[]
		const channels = chats.filter((c) => c.moderated === false) // make sure you can write in those channels
		const channel = channels[Math.floor(Math.random() * channels.length)]
		console.log("Testing on Chat.Channel", channel.name, "with id", channel.channel_id)
		
		tests.push(new Test(api.joinChatChannel, [channel], "Chat.Channel.WithDetails"))
		tests.push(new Test(api.getChatChannel, [channel], "Chat.Channel.WithDetails"))
		tests.push(new Test(api.sendChatMessage, [channel, "hello, just testing something"], "Chat.Message", {content: "hello, just testing something"}))
		tests.push(new Test(api.getChatMessages, [channel], "Chat.Message"))
		tests.push(new Test(api.leaveChatChannel, [channel], false))
	} else {
		tests.push(chat_test)
		console.warn("⚠️ Skipping most chat tests, unable to get chat channels")
	}

	const pm_test = new Test(api.createChatPrivateChannel, [3], "Chat.Channel")
	await pm_test.try()

	if (pm_test) {
		const pm = pm_test.response as osu.Chat.Channel
		tests.push(new Test(api.sendChatPrivateMessage, [3, "hello"], {channel: "Chat.Channel", message: "Chat.Message"},
			[(r: AR<typeof api.sendChatPrivateMessage>) => r.message.content === "hello"]))
		tests.push(new Test(api.leaveChatChannel, [pm], false))
	} else {
		tests.push(pm_test)
		console.warn("⚠️ Skipping some chat tests, unable to create pm channel")
	}

	tests.push(new Test(api.keepChatAlive, [], "Chat.UserSilence"))
	return tests
}

const testForum = async () => {
	const tests: Test<any, any, any>[] = []
	const topic_test = new Test(api.createForumTopic, [85, "osu-api-v2-js test post", `Please ignore this forum post
It was automatically made for the sole purpose of testing [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]`,
	{title: "test poll", options: ["yes", "maybe", "no"], length_days: 14, vote_change: true}], {topic: "Forum.Topic", post: "Forum.Post"})
	await topic_test.try()

	if (topic_test.response) {
		const topic = topic_test.response as {topic: osu.Forum.Topic, post: osu.Forum.Post}
		tests.push(new Test(api.editForumTopicTitle, [topic.topic, "osu-api-v2-js test post!"], "Forum.Topic", {title: "osu-api-v2-js test post!"}))
		tests.push(new Test(api.editForumPost, [topic.post, topic.post.body.raw + " <3"], "Forum.Post", 
			[(r: AR<typeof api.editForumPost>) => r.body.raw === topic.post.body.raw + " <3"]))
	} else {
		console.warn("⚠️ Skipping forum tests, unable to create a forum post")
	}
	return tests
}

const testMultiplayer = async () => {
	const tests: Test<any, any, any>[] = []
	// PLAYLIST
	const playlist_test = new Test(api.getRooms, ["playlists", "all"], "Multiplayer.Room")
	await playlist_test.try()
	tests.push(playlist_test)

	if (playlist_test.response) {
		const room = (playlist_test.response as osu.Multiplayer.Room[])[0]
		tests.push(new Test(api.getRoomLeaderboard, [room], {leaderboard: "Multiplayer.Room.Leader"}))
	} else {
		console.warn("⚠️ Skipping multiplayer playlist tests, unable to get rooms")
	}

	// REALTIME
	const realtime_test = new Test(api.getRooms, ["realtime", "all"], "Multiplayer.Room")
	await realtime_test.try()
	tests.push(realtime_test)

	if (realtime_test.response) {
		const room = (realtime_test.response as osu.Multiplayer.Room[])[0]
		tests.push(new Test(api.getRoomLeaderboard, [room], {leaderboard: "Multiplayer.Room.Leader"}))
	} else {
		console.warn("⚠️ Skipping multiplayer realtime tests, unable to get rooms")
	}

	return tests
}

const testScore = () => {
	const tests: Test<any, any, any>[] = []
	if (server !== "https://osu.ppy.sh") {
		console.log("⚠️ Skipping score tests, unable to do this test on this server")
	} else {
		tests.push(new Test(api.getReplay, [393079484], undefined,
			[(r: AR<typeof api.getReplay>) => r.length === 119546]))
	}
	return tests
}

const testUser = () => [
	new Test(api.getResourceOwner, [], "User.Extended.WithStatisticsrulesets"),
	new Test(api.getFriends, [], undefined,
		[(r: AR<typeof api.getFriends>) => validate(r[0].target, "User.WithCountryCoverGroupsStatisticsSupport")])
]

const test = async (): Promise<void> => {
	const scopes: osu.Scope[] = ["public", "chat.read", "chat.write", "chat.write_manage", "forum.write", "friends.read", "identify"]
	const url = osu.generateAuthorizationURL(id, redirect_uri, scopes, server)
	const code = await getCode(url)
	api = await osu.API.createAsync(id, secret, {code, redirect_uri}, {verbose: "all", timeout: 30, server, retry_on_timeout: true})

	const tests = [
		testChat,
		testForum,
		testMultiplayer,
		testScore,
		testUser
	]

	const results: {test_name: string, passed: boolean}[] = []
	for (let i = 0; i < tests.length; i++) {
		console.log("\n===>", tests[i].name)
		const smaller_tests = await tests[i]()
		let test_pass = true

		for (let i = 0; i < smaller_tests.length; i++) {
			const result = await smaller_tests[i].try()
			if (result.passes.indexOf(false) != -1) {
				console.log(smaller_tests[i].fun.name, result.passes)
				test_pass = false
			}
		}

		results.push({test_name: tests[i].name, passed: test_pass})
	}

	console.log("\n", ...results.map((r) => `${r.test_name}: ${r.passed ? "✔️" : "❌"}\n`))
	await api.revokeToken()

	if (!results.find((r) => !r.passed)) {
		console.log("✔️ Looks like the test went well!")
	} else {
		throw new Error("❌ Something in the test went wrong...")
	}
}

test()
