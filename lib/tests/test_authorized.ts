/**
 * The Authorization Code way
 * The token is considered by the API as myself
 */

import "dotenv/config"
import * as osu from "../index.js"
import promptSync from "prompt-sync"
import { exec } from "child_process"
import util from "util"

const prompt = promptSync({sigint: true})
const server = "https://osu.ppy.sh"

function sleep(seconds: number) {
	return new Promise(resolve => setTimeout(resolve, seconds * 1000))
}

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri, ["public", "chat.read", "chat.write_manage", "forum.write"], server)
	exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)
	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "errors", server)

	// Proof web socket stuff work well
	let socket = api.generateWebSocket()
	socket.on("open", () => {
		socket.send(JSON.stringify({event: "chat.start"}))
		api.keepChatAlive()
		setInterval(() => api.keepChatAlive(), 30 * 1000)
	})
	socket.on("message", (m: any) => {
		let event = JSON.parse(m.toString())
		if (event.event === "chat.message.new") {
			let message = event.data.messages.map((message: any) => message.content).join(" | ")
			let user = event.data.users.map((user: any) => user.username).join(" | ")
			console.log(`${user}: ${message}`)
		}
	})
}

test(process.env.ID, process.env.SECRET, process.env.REDIRECT_URI)
