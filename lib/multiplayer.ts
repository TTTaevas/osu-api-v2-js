import { Beatmap } from "./beatmap.js"
import { API } from "./index.js"
import { Rulesets, Mod } from "./misc.js"
import { Score } from "./score.js"
import { User } from "./user.js"

export namespace Multiplayer {
	/** @obtainableFrom {@link API.getRoom} */
	export interface Room {
		active: boolean
		auto_skip: boolean
		category: string
		channel_id: number
		ends_at: Date | null
		has_password: boolean
		host: User.WithCountry
		id: number
		max_attempts: number | null
		name: string
		participant_count: number
		playlist: Multiplayer.Room.PlaylistItem[]
		queue_mode: string
		recent_participants: User[]
		starts_at: Date
		type: string
		user_id: number
		/** Only exists if authorized user */
		current_user_score?: {
			/** In a format where `96.40%` would be `0.9640` (with some numbers after the zero) */
			accuracy: number
			attempts: number
			completed: number
			pp: number
			room_id: number
			total_score: number
			user_id: number
			/** How many (completed (I think)) attempts on each item? Empty array if the multiplayer room is the realtime kind */
			playlist_item_attempts: {
				attempts: number
				id: number
			}[]
		}
	}

	export namespace Room {
		export interface PlaylistItem {
			id: number
			room_id: number
			beatmap_id: number
			ruleset_id: number
			allowed_mods: Mod[]
			required_mods: Mod[]
			expired: boolean
			owner_id: number
			/** @remarks Should be null if the room isn't the realtime multiplayer kind */
			playlist_order: number | null
			/** @remarks Should be null if the room isn't the realtime multiplayer kind */
			played_at: Date | null
			beatmap: Beatmap.WithBeatmapsetChecksumMaxcombo
		}

		export namespace PlaylistItem {
			/** @obtainableFrom {@link API.getPlaylistItemScores} */
			export interface Scores {
				params: {
					limit: number
					sort: string
				}
				scores: Score.Multiplayer[]
				/** How many scores there are across all pages, not necessarily `scores.length` */
				total: number
				/** @remarks Will be null if not an authorized user or if the authorized user has no score */
				user_score: Score.Multiplayer | null
				/** @remarks Will be null if there is no next page */
				cursor_string: string | null
			}

			/**
			 * Get the scores on a specific item of a room!
			 * @param item An object with the id of the item in question, as well as the id of the room
			 * @param limit How many scores maximum? Defaults to 50, the maximum the API will return
			 * @param sort Sort by scores, ascending or descending? Defaults to descending
			 * @param cursor_string Use a Multiplayer.Scores' `params` and `cursor_string` to get the next page (scores 51 to 100 for example)
			 * @remarks (2024-03-04) This may not work for rooms from before March 5th, use at your own risk
			 * https://github.com/ppy/osu-web/issues/10725
			 */
			export async function getScores(this: API, item: {id: number, room_id: number} | Multiplayer.Room.PlaylistItem, limit: number = 50,
			sort: "score_asc" | "score_desc" = "score_desc", cursor_string?: string): Promise<Multiplayer.Room.PlaylistItem.Scores> {
				return await this.request("get", `rooms/${item.room_id}/playlist/${item.id}/scores`, {limit, sort, cursor_string})
			}
		}
	
		
	
		export interface Leader {
			/** In a format where `96.40%` would be `0.9640` (likely with some numbers after the zero) */
			accuracy: number
			attempts: number
			completed: number
			pp: number
			room_id: number
			total_score: number
			user_id: number
			user: User.WithCountry
		}

		/**
		 * Get data about a lazer multiplayer room (realtime or playlists)!
		 * @param room An object with the id of the room, is at the end of its URL (after `/multiplayer/rooms/`)
		 */
		export async function getOne(this: API, room: {id: number} | Multiplayer.Room): Promise<Multiplayer.Room> {
			return await this.request("get", `rooms/${room.id}`)
		}

		/**
		 * Get playlists/realtime rooms that are active, that have ended, that the user participated in, that the user made, or just simply any room!
		 * @scope {@link Scope"public"}
		 * @param type Whether the multiplayer rooms are in playlist format (like current spotlights) or realtime
		 * @param mode The state of the room, or the relation of the authorized user with the room
		 * @param limit The maximum amount of rooms to return, defaults to 10
		 * @param sort Sort (where most recent is first) by creation date or end date, defaults to the creation date
		 */
		export async function getMultiple(this: API, type: "playlists" | "realtime", mode: "active" | "all" | "ended" | "participated" | "owned",
		limit: number = 10, sort: "ended" | "created" = "created"): Promise<Multiplayer.Room[]> {
			return await this.request("get", "rooms", {type_group: type, mode, limit, sort})
		}

		/**
		 * Get the room stats of all the users of that room!
		 * @scope {@link Scope"public"}
		 * @param room An object with the id of the room in question
		 */
		export async function getLeaderboard(this: API, room: {id: number} | Multiplayer.Room): Promise<Multiplayer.Room.Leader[]> {
			const response = await this.request("get", `rooms/${room.id}/leaderboard`)
			return response.leaderboard
		}
	}

	/** @obtainableFrom {@link API.getMatch} */
	export interface Match {
		match: Match.Info
		events: {
			id: number
			detail: {
				type: string
				/**
				 * If `detail.type` is `other`, this exists and will be the name of the room
				 */
				text?: string
			}
			timestamp: Date
			user_id: number | null
			/**
			 * If `detail.type` is `other`, then this should exist!
			 */
			game?: {
				beatmap_id: number
				id: number
				start_time: Date
				end_time: Date | null
				mode: keyof typeof Rulesets
				mode_int: Rulesets
				scoring_type: string
				team_type: string
				mods: string[]
				beatmap: Beatmap.WithBeatmapset
				scores: Score.WithMatch[]
			}
		}[]
		users: User.WithCountry[]
		first_event_id: number
		latest_event_id: number
		current_game_id: number | null
	}

	export namespace Match {
		/** @obtainableFrom {@link API.getMatches} */
		export interface Info {
			id: number
			start_time: Date
			end_time: Date | null
			name: string
		}

		/**
		 * Get data of a multiplayer lobby from the stable (non-lazer) client that have URLs with `community/matches` or `mp`
		 * @param id Can be found at the end of the URL of said match
		 */
		export async function getOne(this: API, id: number): Promise<Multiplayer.Match> {
			const response = await this.request("get", `matches/${id}`) as Multiplayer.Match
			// I know `events[i].game.scores[e].perfect` can at least be 0 instead of being false; fix that
			for (let i = 0; i < response.events.length; i++) {
				for (let e = 0; e < Number(response.events[i].game?.scores.length); e++) {
					response.events[i].game!.scores[e].perfect = Boolean(response.events[i].game!.scores[e].perfect)
				}
			}
			return response
		}

		export async function getMultiple(this: API): Promise<Multiplayer.Match.Info[]> {
			const response = await this.request("get", "matches")
			return response.matches
		}	
	}
}
