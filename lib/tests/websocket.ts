import "dotenv/config"
import { API, Chat, generateAuthorizationURL, Scope } from "../index.js"
import { getCode, validate } from "./exports.js"
import { expect } from "chai"

/**
 * We are only allowed to access the chats on the actual server, not the dev server,
 * and furthermore, the chats on the dev server are dead, which does not make for great testing
 * @remarks And it's fine to use the actual server here because we won't send any message, we will just *listen*
 */
const server: string = "https://osu.ppy.sh"
const scopes: Scope[] = ["chat.read"]

async function startTesting(id: number, secret: string, redirect_uri: string): Promise<void> {
	const url = generateAuthorizationURL(id, redirect_uri, scopes, server)
	const code = await getCode(url, redirect_uri)
	const api = new API(id, secret, code, redirect_uri, {server, retry_on_timeout: true, verbose: "errors"})

	const websocket = api.generateChatWebsocket()
	websocket.addEventListener("open", async () => {
		websocket.send(Chat.Websocket.Command.chatStart)
		await api.keepChatAlive().then(() => console.log("Made the initial ping!"))
		setInterval(async () => {
			console.time("Server ping made in")
			const silences = await api.keepChatAlive()
			console.timeEnd("Server ping made in")
			expect(validate(silences, "Chat.UserSilence")).to.be.true
		}, 30 * 1000)
	})

	websocket.addEventListener("message", (m) => {
		const parsed: Chat.Websocket.Event.Any = JSON.parse(m.data.toString())
		console.log("Received event:", parsed.event)
		expect(validate(parsed, "Chat.Websocket.Event.Any")).to.be.true

		/**
		 * Apparently, something in the authentication process is unstable, as it is possible to
		 * get an "authentication failed" error roughly 1 out of 2 times (inconsistently) upon running this whole code,
		 * and getting this error means we aren't actually listening to any incoming messages, therefore we need to throw
		 */
		if (!parsed.event && parsed.error) {
			console.error("Looks like you encountered an error, maybe try again!")
			throw new Error(parsed.error)
		}
	})
}

const env_id = process.env.ID
const env_secret = process.env.SECRET
if (env_id === undefined) {throw new Error("❌ The ID for this server has not been defined in the environment variables!")}
if (env_secret === undefined) {throw new Error("❌ The SECRET for this server has not been defined in the environment variables!")}
if (process.env.REDIRECT_URI === undefined) {throw new Error("❌ The REDIRECT_URI has not been defined in the environment variables!")}

startTesting(Number(env_id), env_secret, process.env.REDIRECT_URI)
