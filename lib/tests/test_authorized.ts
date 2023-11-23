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
const server = "https://dev.ppy.sh"

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri, ["public", "friends.read"], server)
	exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)

	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri}, "all", server)
	api.access_token = "a"
	api.expires = new Date(1980)
	let r = await api.getResourceOwner()
	console.log(r.username)
}

test(process.env.DEV_ID, process.env.DEV_SECRET, process.env.REDIRECT_URI)
