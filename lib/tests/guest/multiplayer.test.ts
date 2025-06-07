import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getRoom: Test = async(api) => {
	console.log("|", "Playlist")
	const room_playlist = await api.getRoom(588230)
	expect(room_playlist.id).to.equal(588230)
	expect(room_playlist.participant_count).to.equal(27)
	expect(validate(room_playlist, "Multiplayer.Room.WithHostRecentparticipants")).to.be.true

	console.log("|", "Realtime")
	const room_realtime = await api.getRoom(591993)
	expect(room_realtime.id).to.equal(591993)
	expect(room_realtime.participant_count).to.equal(5)
	expect(validate(room_realtime, "Multiplayer.Room.WithHostRecentparticipants")).to.be.true

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
	expect(validate(response_realtime.scores, "Multiplayer.Room.PlaylistItem.ScoreWithUser")).to.be.true

	return true
}

const getRoomLeaderboard: Test = async(api) => {
	console.log("|", "Playlist")
	const response_playlists = await api.getRoomLeaderboard(588230)
	expect(validate(response_playlists.leaderboard, "Multiplayer.Room.Leader")).to.be.true
	response_playlists.leaderboard.forEach((leader) => expect(leader.room_id).to.equal(588230))
	if (response_playlists.user_score) {expect(validate(response_playlists.user_score, "Multiplayer.Room.Leader.WithPosition"))}

	console.log("|", "Realtime")
	const response_realtime = await api.getRoomLeaderboard(591993)
	expect(validate(response_realtime.leaderboard, "Multiplayer.Room.Leader")).to.be.true
	response_realtime.leaderboard.forEach((leader) => expect(leader.room_id).to.equal(591993))
	if (response_realtime.user_score) {expect(validate(response_realtime.user_score, "Multiplayer.Room.Leader.WithPosition"))}

	return true
}

const getRoomEvents: Test = async(api) => {
	const response = await api.getRoomEvents(1379842)
	expect(response.room.id).to.equal(1379842)
	expect(response.first_event_id).to.be.lessThan(response.last_event_id)
	expect(response.users).to.have.lengthOf(2)
	expect(response.playlist_items).to.have.lengthOf(17)

	expect(validate(response.beatmaps, "Beatmap")).to.be.true
	expect(validate(response.beatmapsets, "Beatmapset.WithHype")).to.be.true
	expect(validate(response.events, "Multiplayer.Room.Event")).to.be.true
	expect(validate(response.playlist_items, "Multiplayer.Room.PlaylistItem.WithDetailsScores")).to.be.true
	expect(validate(response.room, "Multiplayer.Room")).to.be.true
	expect(validate(response.users, "User.WithCountry")).to.be.true
	return true
}

export const tests = [
	getRoom,
	getPlaylistItemScores,
	getRoomLeaderboard,
	getRoomEvents,
]
