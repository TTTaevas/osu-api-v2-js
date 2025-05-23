import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getRooms: Test = async(api) => {
	console.log("| realtime")
	const rooms_realtime = await api.getRooms("realtime", "all")
	expect(rooms_realtime).to.have.lengthOf(10)
	rooms_realtime.forEach((room) => expect(room.category).to.equal("normal"))
	rooms_realtime.forEach((room) => expect(room.type).to.not.equal("playlists"))
	expect(validate(rooms_realtime, "Multiplayer.Room")).to.be.true

	console.log("| playlists")
	const rooms_playlist = await api.getRooms("playlists", "all")
	expect(rooms_playlist).to.have.lengthOf(10)
	rooms_playlist.forEach((room) => expect(room.type).to.equal("playlists"))
	expect(validate(rooms_playlist, "Multiplayer.Room")).to.be.true

	return true
}

export const tests = [
	getRooms,
]
