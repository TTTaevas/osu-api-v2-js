import "dotenv/config"
import util = require('util')
import * as osu from "."

async function test(id: string | undefined, secret: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}

	let api = await osu.API.createAsync({id: Number(id), secret})
	if (api) {
		let users = await api.getUsers([7276846])
		console.log(util.inspect(users, false, null, true))
	}
}

test(process.env.ID, process.env.SECRET)
