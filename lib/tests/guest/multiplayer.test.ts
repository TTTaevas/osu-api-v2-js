import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getRoom: Test = async(api) => {
	console.log("|", "Playlist")
	const room_playlist = await api.getRoom(588230)
	expect(room_playlist.id).to.equal(588230)
	expect(room_playlist.participant_count).to.equal(27)
	expect(validate(room_playlist, "Multiplayer.Room")).to.be.true

	console.log("|", "Realtime")
	const room_realtime = await api.getRoom(591993)
	expect(room_realtime.id).to.equal(591993)
	expect(room_realtime.participant_count).to.equal(5)
	expect(validate(room_realtime, "Multiplayer.Room")).to.be.true

	return true
}

const getPlaylistItemScores: Test = async(api) => {
	console.log("|", "Playlist")
	const response_playlist = await api.getPlaylistItemScores({id: 5371540, room_id: 588230})
	expect(response_playlist.cursor_string).to.be.null
	expect(response_playlist.user_score).to.be.null
	expect(response_playlist.params.limit).to.be.a("number")
	expect(response_playlist.params.sort).to.be.a("string")
	expect(response_playlist.total).to.be.greaterThan(0)
	expect(response_playlist.scores).to.have.length.greaterThan(0)
	response_playlist.scores.forEach((score) => expect(score.playlist_item_id).to.equal(5371540))
	response_playlist.scores.forEach((score) => expect(score.room_id).to.equal(588230))
	expect(validate(response_playlist.scores, "Multiplayer.Room.PlaylistItem.Score")).to.be.true

	console.log("|", "Realtime")
	const response_realtime = await api.getPlaylistItemScores({id: 5421279, room_id: 591993})
	expect(response_realtime.cursor_string).to.be.null
	expect(response_realtime.user_score).to.be.null
	expect(response_realtime.params.limit).to.be.a("number")
	expect(response_realtime.params.sort).to.be.a("string")
	expect(response_realtime.total).to.be.greaterThan(0)
	expect(response_realtime.scores).to.have.length.greaterThan(0)
	response_realtime.scores.forEach((score) => expect(score.playlist_item_id).to.equal(5421279))
	response_realtime.scores.forEach((score) => expect(score.room_id).to.equal(591993))
	expect(validate(response_realtime.scores, "Multiplayer.Room.PlaylistItem.Score")).to.be.true

	return true
}

export const tests = [
	getRoom,
	getPlaylistItemScores,
]
