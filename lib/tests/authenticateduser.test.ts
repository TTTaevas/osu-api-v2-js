/**
 * The Authorization Code way
 * The token is considered by the API as a user (myself)
 * https://osu.ppy.sh/docs/#authorization-code-grant
 */

import "dotenv/config"
import * as osu from "../index.js"
import { afterAll, beforeAll, describe, expect, expectTypeOf, test } from "vitest"

import { exec } from "child_process"
import http from "http"

if (process.env.REDIRECT_URI === undefined) {throw new Error("❌ The SECRET has not been defined in the environment variables!")}
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


beforeAll(async () => {
	const scopes: osu.Scope[] = ["public", "chat.read", "chat.write", "chat.write_manage", "forum.write", "friends.read", "identify"]
	const url = osu.generateAuthorizationURL(Number(id), redirect_uri, scopes, server)

	const httpserver = http.createServer()
	const host = redirect_uri.substring(redirect_uri.indexOf("/") + 2, redirect_uri.lastIndexOf(":"))
	const port = Number(redirect_uri.substring(redirect_uri.lastIndexOf(":") + 1).split("/")[0])
	httpserver.listen({host, port})
	exec(`xdg-open "${url}"`)

	const code: string = await new Promise((resolve) => {
		httpserver.on("request", (request, response) => {
			if (request.url) {
				response.end("Worked! You may now close this tab.", "utf-8")
				resolve(request.url.substring(request.url.indexOf("code=") + 5))
			}
		})
	})

	api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "all", server)
	api.timeout = 30
	api.verbose = "errors"
})

afterAll(async () => {
	api.verbose = "all"
	await api.revokeToken()
})


describe("Chat stuff", () => {
	let channels: osu.Chat.Channel[]
	let test_channel: osu.Chat.Channel

	test("getChatChannels", async () => {
		channels = await api.getChatChannels()
		expect(channels.length).greaterThan(0)
		expectTypeOf(channels).toEqualTypeOf<Awaited<ReturnType<typeof api.getChatChannels>>>()

		const writable_channels = channels.filter((c) => c.moderated === false) // make sure you can write in those channels
		test_channel = writable_channels[Math.floor(Math.random() * writable_channels.length)]
		console.log("Testing on Chat.Channel", test_channel.name, "with id", test_channel.channel_id)
	})

	describe("Interact with a public channel", () => {
		test("joinChatChannel", async () => {
			const channel = await api.joinChatChannel(test_channel)
			expectTypeOf(channel).toEqualTypeOf<Awaited<ReturnType<typeof api.joinChatChannel>>>()
		})

		test("getChatChannel", async () => {
			const channel = await api.getChatChannel(test_channel)
			expectTypeOf(channel).toEqualTypeOf<Awaited<ReturnType<typeof api.getChatChannel>>>()
		})

		let messages: osu.Chat.Message[]
		test("getChatMessages", async () => {
			messages = await api.getChatMessages(test_channel)
			expectTypeOf(messages).toEqualTypeOf<Awaited<ReturnType<typeof api.getChatMessages>>>()
		})

		test("markChatChannelAsRead", async () => {
			if (messages.length) {
				const response = await api.markChatChannelAsRead(test_channel, messages[0])
				expectTypeOf(response).toEqualTypeOf<Awaited<ReturnType<typeof api.markChatChannelAsRead>>>()
			} else {
				console.log("⚠️ (getReplay) Skipping, unable to do this test as there are no messages to be found on this channel")
			}
		})

		test("sendChatMessage", async () => {
			const message = await api.sendChatMessage(test_channel, "hello, just testing something")
			expect(message).toHaveProperty("content", "hello, just testing something")
			expectTypeOf(message).toEqualTypeOf<Awaited<ReturnType<typeof api.sendChatMessage>>>()
		})

		test("leaveChatChannel", async () => {
			const response = await api.leaveChatChannel(test_channel)
			expectTypeOf(response).toEqualTypeOf<Awaited<ReturnType<typeof api.leaveChatChannel>>>()
		})
	})

	let dm_channel: osu.Chat.Channel
	test("createChatPrivateChannel", async () => {
		dm_channel = await api.createChatPrivateChannel(3)
		expectTypeOf(dm_channel).toEqualTypeOf<Awaited<ReturnType<typeof api.createChatPrivateChannel>>>()
	})

	describe("Interact with a private channel", () => {
		test("sendChatPrivateMessage", async () => {
			const event = await api.sendChatPrivateMessage(3, "hello") // sendChatPrivateMessage uses the USER's id
			expect(event.message).toHaveProperty("content", "hello")
			expectTypeOf(event).toEqualTypeOf<Awaited<ReturnType<typeof api.sendChatPrivateMessage>>>()
		})

		test("leaveChatChannel", async () => {
			const response = await api.leaveChatChannel(dm_channel) // leaveChatChannel uses the CHANNEL's id
			expectTypeOf(response).toEqualTypeOf<Awaited<ReturnType<typeof api.leaveChatChannel>>>()
		})
	})

	test("keepChatAlive", async () => {
		const silences = await api.keepChatAlive()
		expectTypeOf(silences).toEqualTypeOf<Awaited<ReturnType<typeof api.keepChatAlive>>>()
	})
})

describe("Forum stuff", () => {
	let forum: {topic: osu.Forum.Topic, post: osu.Forum.Post}
	test("createForumTopic", async () => {
		forum = await api.createForumTopic(85, "osu-api-v2-js test post", `Please ignore this forum post
It was automatically made for the sole purpose of testing [url=https://github.com/TTTaevas/osu-api-v2-js]osu-api-v2-js[/url]`,
		{title: "test poll", options: ["yes", "maybe", "no"], length_days: 14, vote_change: true})
		expectTypeOf(forum).toEqualTypeOf<Awaited<ReturnType<typeof api.createForumTopic>>>()
	})

	test("editForumTopicTitle", async () => {
		const topic = await api.editForumTopicTitle(forum.topic, "osu-api-v2-js test post!")
		expect(topic).toHaveProperty("title", "osu-api-v2-js test post!")
		expectTypeOf(topic).toEqualTypeOf<Awaited<ReturnType<typeof api.editForumTopicTitle>>>()
	})

	test("editForumPost", async () => {
		const post = await api.editForumPost(forum.post, forum.post.body.raw + " <3")
		expect(post.body).toHaveProperty("raw", forum.post.body.raw + " <3")
		expectTypeOf(post).toEqualTypeOf<Awaited<ReturnType<typeof api.editForumPost>>>()
	})
})

describe("Multiplayer stuff", () => {
	describe("Realtime rooms", () => {
		let rooms: osu.Multiplayer.Room[]
		test("getRooms", async () => {
			rooms = await api.getRooms("realtime", "all")
			expectTypeOf(rooms).toEqualTypeOf<Awaited<ReturnType<typeof api.getRooms>>>()
		})

		test("getRoomLeaderboard", async () => {
			const room = await api.getRoomLeaderboard(rooms[0])
			expectTypeOf(room).toEqualTypeOf<Awaited<ReturnType<typeof api.getRoomLeaderboard>>>()
		})
	})

	describe("Playlists rooms", () => {
		let rooms_playlists: osu.Multiplayer.Room[]
		test("getRooms", async () => {
			rooms_playlists = await api.getRooms("playlists", "all")
			expectTypeOf(rooms_playlists).toEqualTypeOf<Awaited<ReturnType<typeof api.getRooms>>>()
		})

		test("getRoomLeaderboard", async () => {
			const room = await api.getRoomLeaderboard(rooms_playlists[0])
			expectTypeOf(room).toEqualTypeOf<Awaited<ReturnType<typeof api.getRoomLeaderboard>>>()
		})
	})
})

describe("Score stuff", () => {
	test("getReplay", async () => {
		if (server === "https://osu.ppy.sh") {
			const replay = await api.getReplay(393079484)
			expect(replay).toHaveLength(119546)
			expectTypeOf(replay).toEqualTypeOf<Awaited<ReturnType<typeof api.getReplay>>>()
		} else {
			console.log("⚠️ (getReplay) Skipping, unable to do this test on this server")
		}
	})
})

describe("User stuff", () => {
	test("getResourceOwner", async () => {
		const user = await api.getResourceOwner()
		expectTypeOf(user).toEqualTypeOf<Awaited<ReturnType<typeof api.getResourceOwner>>>()
	})
	
	test("getFriends", async () => {
		const users = await api.getFriends()
		expectTypeOf(users).toEqualTypeOf<Awaited<ReturnType<typeof api.getFriends>>>()
	})
})
