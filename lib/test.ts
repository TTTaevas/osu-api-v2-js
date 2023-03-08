import "dotenv/config"
import util = require('util')
import * as osu from "."

async function test(id: string | undefined, secret: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no ID env var")}

	let api = await osu.API.createAsync({id: Number(id), secret})
	if (api) {
		let beatmaps = await api.getBeatmaps([2592029])
		console.log(util.inspect(beatmaps, false, null, true))
	}
}

test(process.env.ID, process.env.SECRET)
