import { Beatmap } from "./beatmap.js"
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
		playlist: PlaylistItem[]
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

	/** @obtainableFrom {@link API.getMatches} */
	export interface MatchInfo {
		id: number
		start_time: Date
		end_time: Date | null
		name: string
	}

	/** @obtainableFrom {@link API.getMatch} */
	export interface Match {
		match: MatchInfo
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
}
