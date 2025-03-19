import { API, Beatmap, Chat, Mod, Ruleset, Score as IScore, User } from "./index.js"

export namespace Multiplayer {
	/**
	 * @obtainableFrom
	 * {@link API.getRoom} /
	 * {@link API.getRooms}
	 */
	export interface Room {
		id: number
		name: string
		category: "normal" | "spotlight" | "daily_challenge"
		type: "head_to_head" | "team_versus" | "playlists"
		user_id: User["id"]
		starts_at: Date
		ends_at: Date | null
		max_attempts: number | null
		participant_count: number
		channel_id: Chat.Channel["channel_id"]
		active: boolean
		has_password: boolean
		queue_mode: "all_players" | "all_players_round_robin" | "host_only"
		auto_skip: boolean
		host: User.WithCountry
		recent_participants: User[]
		current_playlist_item?: Room.PlaylistItem.WithBeatmap | null
		playlist?: Room.PlaylistItem.WithComplexBeatmap[]
		playlist_item_stats?: {
			count_active: number
			count_total: number
			ruleset_ids: Ruleset[]
		}
		difficulty_range?: {min: Beatmap["difficulty_rating"], max: Beatmap["difficulty_rating"]}
		/** Only exists if the authorized user has played */
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
		}

		export namespace PlaylistItem {
			export interface WithBeatmap extends PlaylistItem {
				beatmap: Beatmap.WithBeatmapset
			}

			export interface WithComplexBeatmap extends PlaylistItem {
				beatmap: Beatmap.WithBeatmapsetChecksumMaxcombo
			}

			/** @obtainableFrom {@link API.getPlaylistItemScores} */
			export interface Score extends IScore.WithUser {
				playlist_item_id: PlaylistItem["id"]
				room_id: Room["id"]
			}

			/**
			 * Get the scores on a specific item of a room!
			 * @param item An object with the id of the item in question, as well as the id of the room
			 * @param limit How many scores maximum? Defaults to 50, the maximum the API will return
			 * @param sort Sort by scores, ascending or descending? Defaults to descending
			 * @param cursor_string Use a Multiplayer.Scores' `params` and `cursor_string` to get the next page (scores 51 to 100 for example)
			 * @remarks This will **not work for rooms created before ~March 5th 2024** https://github.com/ppy/osu-web/issues/10725
			 */
			export async function getScores(this: API, item: {id: number, room_id: number} | Multiplayer.Room.PlaylistItem, limit: number = 50,
			sort: "score_asc" | "score_desc" = "score_desc", cursor_string?: string): Promise<{
				params: {limit: number, sort: string}
				scores: Score[]
				/** How many scores there are across all pages, not necessarily `scores.length` */
				total: number
				/** @remarks Will be null if not an authorized user or if the authorized user has no score */
				user_score: Score | null
				/** @remarks Will be null if there is no next page */
				cursor_string: string | null
			}> {
				return await this.request("get", ["rooms", item.room_id, "playlist", item.id, "scores"], {limit, sort, cursor_string})
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
			/** @obtainableFrom {@link API.getRoomLeaderboard} */
			export interface WithPosition extends Leader {
				position: number
			}

			/**
			 * Get the room stats of all the users of that room!
			 * @scope {@link Scope"public"}
			 * @param room The room or the id of the room in question
			 * @returns An object with the leaderboard, and the score and position of the authorized user under `user_score`
			 */
			export async function getMultiple(this: API, room: Room["id"] | Room): Promise<{leaderboard: Leader[], user_score: Leader.WithPosition | null}> {
				const room_id = typeof room === "number" ? room : room.id
				return await this.request("get", ["rooms", room_id, "leaderboard"])
			}
		}

		/**
		 * Get data about a lazer multiplayer room (realtime or playlists)!
		 * @param room The room or the id of the room, can be found at the end of its URL (after `/multiplayer/rooms/`)
		 */
		export async function getOne(this: API, room: Room["id"] | Room): Promise<Room> {
			const room_id = typeof room === "number" ? room : room.id
			return await this.request("get", ["rooms", room_id])
		}

		/**
		 * Get playlists/realtime rooms that are active, that have ended, that the user participated in, that the user made, or just simply any room!
		 * @scope {@link Scope"public"}
		 * @param type Whether the multiplayer rooms are in playlist format (like current spotlights) or realtime
		 * @param mode The state of the room, or the relation of the authorized user with the room
		 * @param limit The maximum amount of rooms to return, defaults to 10
		 * @param sort Sort (where most recent is first) by creation date or end date, defaults to the creation date
		 * @param season_id Only get rooms (playlists) that belong to a specific (modern) *Beatmap Spotlights* season **id**
		 * (so `5`'d be summer 2020's mania rooms, not winter 2022!!)
		 */
		export async function getMultiple(this: API, type: "playlists" | "realtime", mode: "active" | "all" | "ended" | "participated" | "owned",
		limit: number = 10, sort: "ended" | "created" = "created", season_id?: number): Promise<Room[]> {
			return await this.request("get", ["rooms"], {type_group: type, mode, limit, sort, season_id})
		}
	}
}
