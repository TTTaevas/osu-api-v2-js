import "dotenv/config"
import { API, generateAuthorizationURL, Scope } from "../index.js"
import { getCode, runTests, Test } from "./exports.js"

import * as Chat from "./authenticated/chat.test.js"
import * as Forum from "./authenticated/forum.test.js"
import * as Multiplayer from "./authenticated/multiplayer.test.js"
import * as Score from "./authenticated/score.test.js"
import * as User from "./authenticated/user.test.js"

const server: string = "https://dev.ppy.sh"
const scopes: Scope[] = ["public", "chat.read", "chat.write", "chat.write_manage", "forum.write", "friends.read", "identify"]

const domains: Test[][] = [
	Chat.tests,
	Forum.tests,
	Multiplayer.tests,
	Score.tests,
	User.tests,
]

async function startRunningTests(id: number, secret: string, redirect_uri: string): Promise<void> {
	const url = generateAuthorizationURL(id, redirect_uri, scopes, server)
	const code = await getCode(url, redirect_uri)
	const api = await API.createAsync(id, secret, {code, redirect_uri}, {server, retry_on_timeout: true, verbose: "all"})
	// api = api.withSettings({headers: {"x-api-version": getCurrentDateString()}})
	await runTests(api, domains)
}

if (server === "https://osu.ppy.sh") {
	for (let i = 0; i < 5; i++) {
		console.warn("⚠️ DOING THE TESTS ON THE ACTUAL OSU SERVER")
	}
}

const env_id = server === "https://osu.ppy.sh" ? process.env.ID : process.env.DEV_ID
const env_secret = server === "https://osu.ppy.sh" ? process.env.SECRET : process.env.DEV_SECRET
if (env_id === undefined) {throw new Error("❌ The ID for this server has not been defined in the environment variables!")}
if (env_secret === undefined) {throw new Error("❌ The SECRET for this server has not been defined in the environment variables!")}
if (process.env.REDIRECT_URI === undefined) {throw new Error("❌ The REDIRECT_URI has not been defined in the environment variables!")}

startRunningTests(Number(env_id), env_secret, process.env.REDIRECT_URI)
