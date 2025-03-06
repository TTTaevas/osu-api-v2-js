import { API } from "../../index.js"
import { expect } from "chai"
import { validate, Test } from "../exports.js"

const getRoom: Test = async(api: API) => {
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

const getPlaylistItemScores: Test = async(api: API) => {
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

const getMatch: Test = async(api: API) => {
	console.log("|", "Without teams")
	const response_noteams = await api.getMatch(75706987, {limit: 15})
	expect(response_noteams.match.id).to.equal(75706987)
	expect(response_noteams.match.name).to.equal("KC: (Taevas) vs (Stipoki)")
	expect(response_noteams.current_game_id).to.be.null
	expect(response_noteams.events).to.have.lengthOf(15)
	response_noteams.events.forEach((e) => e.game?.scores.forEach((score) => expect(score.match.team).to.equal("none")))
	expect(validate(response_noteams, "Multiplayer.Match")).to.be.true

	console.log("|", "With teams")
	const response_teams = await api.getMatch(62006076, {limit: 15})
	expect(response_teams.match.id).to.equal(62006076)
	expect(response_teams.match.name).to.equal("CWC2020: (Italy) vs (Indonesia)")
	expect(response_teams.current_game_id).to.be.null
	expect(response_teams.events).to.have.lengthOf(15)
	response_teams.events.forEach((e) => e.game?.scores.forEach((score) => expect(score.match.team).to.not.equal("none")))
	expect(validate(response_teams, "Multiplayer.Match")).to.be.true

	return true
}

const getMatches: Test = async(api: API) => {
	const matches = await api.getMatches({limit: 2})
	expect(matches).to.have.lengthOf(2)
	matches.forEach((match) => expect(match.id).to.be.greaterThan(111250329))
	expect(validate(matches, "Multiplayer.Match.Info")).to.be.true
	return true
}

export const tests = [
	getRoom,
	getPlaylistItemScores,
	getMatch,
	getMatches,
]
