import * as osu from "../index.js"
import "dotenv/config"
import util = require('util')
// console.log(util.inspect(users, false, null, true))

async function test(id: string | undefined, secret: string | undefined) {
	if (id === undefined) {throw new Error("no ID env var")}
	if (secret === undefined) {throw new Error("no SECRET env var")}

	let api = await osu.API.createAsync({id: Number(id), secret})
	
	let user = await api.getUser({id: 7276846}, osu.Rulesets.osu)
	if (user.replays_watched_counts![0].start_date.toISOString() !== "2016-01-01T00:00:00.000Z") {
		throw new Error("User is not what it should be")
	}

	let attributes = await api.getBeatmapAttributes({id: 809513}, osu.Rulesets.osu, [{acronym: "DT"}, {acronym: "HD"},])
	if (attributes.approach_rate! < 10.3) {
		throw new Error("Beatmap Attributes are not what they should be")
	}
	
	let room = await api.getRoom({id: 231069})
	if (room.playlist[room.playlist.length - 1].beatmap_id !== 809513) {
		throw new Error("Room is not what it should be")
	}

	let matches = await api.getMatches()

	let match = await api.getMatch(106369699)
	if (match.latest_event_id !== 2203711864) {
		throw new Error("Match is not what it should be")
	}

	let ranking = await api.getRanking(osu.Rulesets.osu, "performance", "all")

	let spotlights = await api.getSpotlights()
}

test(process.env.ID, process.env.SECRET)
