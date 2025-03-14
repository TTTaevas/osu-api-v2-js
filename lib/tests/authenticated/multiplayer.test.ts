import { Multiplayer } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

let test_realtime: Multiplayer.Room | undefined
let test_playlists: Multiplayer.Room | undefined

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

	test_realtime = rooms_realtime.sort((a, b) => b.participant_count - a.participant_count).at(0)
	test_playlists = rooms_playlist.sort((a, b) => b.participant_count - a.participant_count).at(0)
	console.log("| Further Multiplayer tests will be made on Multiplayer.Rooms with realtime id", test_realtime?.id, "and playlists id", test_playlists?.id)
	return true
}

const getRoomLeaderboard: Test = async(api) => {
	console.log("| realtime")
	const response_realtime = await api.getRoomLeaderboard(test_realtime!)
	if (!response_realtime.leaderboard.length) {console.warn("|| ⚠️ Empty leaderboard!")}
	expect(validate(response_realtime.leaderboard, "Multiplayer.Room.Leader")).to.be.true
	response_realtime.leaderboard.forEach((leader) => expect(leader.room_id).to.equal(test_realtime!.id))
	if (response_realtime.user_score) {expect(validate(response_realtime.user_score, "Multiplayer.Room.Leader.WithPosition"))}

	console.log("| playlists")
	const response_playlists = await api.getRoomLeaderboard(test_playlists!)
	if (!response_playlists.leaderboard.length) {console.warn("|| ⚠️ Empty leaderboard!")}
	expect(validate(response_playlists.leaderboard, "Multiplayer.Room.Leader")).to.be.true
	response_playlists.leaderboard.forEach((leader) => expect(leader.room_id).to.equal(test_playlists!.id))
	if (response_playlists.user_score) {expect(validate(response_playlists.user_score, "Multiplayer.Room.Leader.WithPosition"))}

	return true
}

export const tests = [
	getRooms,
	getRoomLeaderboard,
]
