import "dotenv/config"
import util = require('util')
import * as osu from "."

const prompt = require("prompt-sync")({sigint: true})

async function test(id: string | undefined, secret: string | undefined, redirect_uri: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}
	if (redirect_uri === undefined) {throw new Error("no REDIRECT_URI env var")}

	let code = prompt(`What code do you get from: 
	${osu.generateAuthorizationURL(Number(id), redirect_uri, ["identify", "public"])}`)

	let api = await osu.API.createAsync({id: Number(id), secret}, {code, redirect_uri})
	if (api) {
		let users = await api.getUsers([7276846])
		console.log(util.inspect(users, false, null, true))
	}
}

test(process.env.ID, process.env.SECRET, process.env.REDIRECT_URI)
