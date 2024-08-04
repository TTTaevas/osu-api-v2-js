import { API, Beatmap, Chat, Mod, Ruleset, Score, User } from "./index.js"
import { getId } from "./misc.js"

export namespace Multiplayer {
	/** @obtainableFrom {@link API.getRoom} */
	export interface Room {
		active: boolean
		auto_skip: boolean
		category: string
		channel_id: Chat.Channel["channel_id"]
		ends_at: Date | null
		has_password: boolean
		host: User.WithCountry
		id: number
		max_attempts: number | null
		name: string
		participant_count: number
		playlist: Room.PlaylistItem[]
		queue_mode: string
		recent_participants: User[]
		starts_at: Date
		type: string
		user_id: User["id"]
		/** Only exists if authorized user */
		current_user_score?: {
			/** In a format where `96.40%` would be `0.9640` (with some numbers after the zero) */
			accuracy: number
			attempts: number
			completed: number
			pp: number
			room_id: Room["id"]
			total_score: number
			user_id: User["id"]
			/** How many (completed (I think)) attempts on each item? Empty array if the multiplayer room is the realtime kind */
			playlist_item_attempts: {
				attempts: number
				id: Room.PlaylistItem["id"]
			}[]
		}
	}

	export namespace Room {
		export interface PlaylistItem {
			id: number
			room_id: number
			beatmap_id: Beatmap["id"]
			ruleset_id: Ruleset
			allowed_mods: Mod[]
			required_mods: Mod[]
			expired: boolean
			owner_id: User["id"]
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
			 * @remarks (2024-03-04) This may not work for rooms from before March 5th 2024, use at your own risk
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
			room_id: Room["id"]
			total_score: number
			user_id: User["id"]
			user: User.WithCountry
		}

		export namespace Leader {
			export interface WithPosition extends Leader {
				position: number
			}

			/**
			 * Get the room stats of all the users of that room!
			 * @scope {@link Scope"public"}
			 * @param room The room or the id of the room in question
			 * @returns An object with the leaderboard, and the score and position of the authorized user under `user_score`
			 */
			export async function getMultiple(this: API, room: number | Room): Promise<{leaderboard: Leader[], user_score: Leader.WithPosition | null}> {
				return await this.request("get", `rooms/${getId(room)}/leaderboard`)
			}
		}

		/**
		 * Get data about a lazer multiplayer room (realtime or playlists)!
		 * @param room The room or the id of the room, can be found at the end of its URL (after `/multiplayer/rooms/`)
		 */
		export async function getOne(this: API, room: number | Room): Promise<Room> {
			return await this.request("get", `rooms/${getId(room)}`)
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
		limit: number = 10, sort: "ended" | "created" = "created"): Promise<Room[]> {
			return await this.request("get", "rooms", {type_group: type, mode, limit, sort})
		}
	}

	/** @obtainableFrom {@link API.getMatch} */
	export interface Match {
		match: Match.Info
		events: Match.Event[]
		users: User.WithCountry[]
		first_event_id: Match.Event["id"]
		latest_event_id: Match.Event["id"]
		current_game_id: number | null
	}

	export namespace Match {
		export interface Event {
			id: number
			detail: {
				type: string
				/** If `detail.type` is `other`, this exists and will be the name of the room */
				text?: string
			}
			timestamp: Date
			user_id: User["id"] | null
			/** If `detail.type` is `other`, then this should exist! */
			game?: {
				beatmap_id: Beatmap["id"]
				id: number
				start_time: Date
				end_time: Date | null
				mode: keyof typeof Ruleset
				mode_int: Ruleset
				scoring_type: string
				team_type: string
				mods: string[]
				beatmap: Beatmap.WithBeatmapset
				scores: Score.WithMatch[]
			}
		}

		/** @obtainableFrom {@link API.getMatches} */
		export interface Info {
			id: number
			start_time: Date
			end_time: Date | null
			name: string
		}

		/**
		 * Get data of a multiplayer lobby from the stable (non-lazer) client that have URLs with `community/matches` or `mp`
		 * @param match The id of a match can be found at the end of its URL
		 * @param query Filter and limit the amount of events shown
		 */
		export async function getOne(this: API, match: Info["id"] | Info, query?: {
			/** Filter FOR events BEFORE this one */
			before?: Match.Event["id"] | Match.Event,
			/** Filter FOR events AFTER this one */
			after?: Match.Event["id"] | Match.Event,
			/** 
			 * From 1 to 101 events (defaults to **100**)
			 * @remarks 0 is treated as 1, anything above 101 is treated as 101
			 */
			limit?: number
		}): Promise<Match> {
			const response = await this.request("get", `matches/${getId(match)}`, {
				before: query?.before ? getId(query.before) : undefined,
				after: query?.after ? getId(query.after) : undefined,
				limit: query?.limit
			}) as Match

			// This converts scores' "perfect" from number to boolean
			for (let i = 0; i < response.events.length; i++) {
				for (let e = 0; e < Number(response.events[i].game?.scores.length); e++) {
					response.events[i].game!.scores[e].perfect = Boolean(response.events[i].game!.scores[e].perfect)
				}
			}

			return response
		}

		/**
		 * Get the info about several matches!
		 * @param query The id of the first match of the array, and the sorting and size of said array
		 */
		export async function getMultiple(this: API, query?: {
			/** 
			 * Which match should be featured at index 0 of the returned array? Will get one with a similar id if it is unavailable
			 * @remarks You can use this argument differently to get all matches before/after (depending of `query.sort`) a certain match,
			 * by adding +1/-1 to its id! So if you want all matches after match_id 10 with sorting is_desc, just have this argument be 10 + 1, or 11!
			 */
			first_match_in_array?: Info["id"] | Info
			/** The maximum amount of elements returned in the array (defaults to **50**) */
			limit?: number
			/** "id_desc" has the biggest id (most recent start_time) at the beginning of the array, "id_asc" is the opposite (defaults to **id_desc**) */
			sort?: "id_desc" | "id_asc"
		}): Promise<Info[]> {
			// `first_match_in_array` is a cool way to use the endpoint's cursor
			const cursor = query?.first_match_in_array ? {match_id: getId(query.first_match_in_array) + (query?.sort === "id_asc" ? -1 : 1)} : undefined
			const response = await this.request("get", "matches", {cursor, limit: query?.limit, sort: query?.sort})
			return response.matches // NOT the only property; `params` is useless while `cursor` and `cursor_string` are superseded by `first_match_in_array`
		}	
	}
}
