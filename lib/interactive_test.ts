import "dotenv/config"
import util = require('util')
import * as osu from "."

const prompt = require("prompt-sync")({sigint: true})

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let url = osu.generateAuthorizationURL(Number(id), redirect_uri, ["identify", "public", "friends.read"])
	require('child_process').exec(`xdg-open "${url}"`)
	let code = prompt(`What code do you get from: ${url}\n\n`)

	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri})
	if (api) {
		let friends = await api.getFriends()
		if (!(friends instanceof osu.APIError)) {console.log(friends[0].statistics?.level.current); console.log(util.inspect(friends[0], false, null, true))}
	}
}

test(process.env.ID, process.env.SECRET, process.env.REDIRECT_URI)
