import { Beatmap } from "./beatmap.js"
import { Rulesets, Mod } from "./misc.js"
import { User, UserWithCountry, UserWithCountryCover } from "./user.js"

/**
 * @remarks This is entirely absent from the official documentation
 * even though it's essential to get scores, due to the playlist system
 */
export interface Room {
	id: number
	name: string
	category: string
	type: string
	user_id: number
	starts_at: Date
	ends_at: Date | null
	max_attempts: number | null
	participant_count: number
	channel_id: number
	active: boolean
	has_password: boolean
	queue_mode: string
	auto_skip: boolean
	current_user_score: {[k: string]: any}
	host: User
	playlist: PlaylistItem[]
	recent_participants: User[]
}

/**
 * @remarks This is entirely absent from the official documentation
 * even though it's essential to get scores, due to the playlist system
 */
export interface PlaylistItem {
	id: number
	room_id: number
	beatmap_id: number
	ruleset_id: number
	allowed_mods: Mod[]
	required_mods: Mod[]
	expired: boolean
	owner_id: number
	playlist_order: number
	played_at: Date
	beatmap: Beatmap
}

export interface MultiplayerScore {
	id: number
	/**
	 * The ID of the user who made the score
	 */
	user_id: number
	room_id: number
	playlist_item_id: number
	beatmap_id: number
	rank: string
	total_score: number
	/**
	 * In a format where `96.40%` would be `0.9640` (and no number afterwards)
	 */
	accuracy: number
	max_combo: number
	mods: Mod[]
	statistics: any
	passed: boolean
	started_at?: Date
	ended_at?: Date
	position?: number | null
	/**
	 * (2023-11-14) Doesn't seem to be there anymore for getPlaylistItemScores?
	 */
	scores_around?: {
		higher: MultiplayerScores
		lower: MultiplayerScores
	}
	user: UserWithCountryCover
}

export interface MultiplayerScores {
	cursor_string: any
	params: {[k: string]: any}
	scores: MultiplayerScore[]
	total: number | null
	user_score: MultiplayerScore | null
}

export interface Leader {
	/**
	 * In a format where `96.40%` would be `0.9640` (likely with some numbers after the zero)
	 */
	accuracy: number
	attempts: number
	completed: number
	pp: number
	room_id: number
	total_score: number
	user_id: number
	user: UserWithCountry
}

export interface MatchInfo {
	id: number
	start_time: Date
	end_time: Date | null
	name: string
}

export interface Match {
	match: MatchInfo
	events: {
		id: number
		detail: {
			type: string
			text?: string
		}
		timestamp: Date
		user_id: number | null
		game?: {
			beatmap_id: number
			id: number
			start_time: Date
			end_time: Date | null
			mode: string
			mode_int: Rulesets
			scoring_type: string
			team_type: string
			mods: string[]
			beatmap: Beatmap
		}
		scores?: {
			accuracy: number
			best_id: number | null
			created_at: Date
			id: number | null
			max_combo: number
			mode: string
			mode_int: Rulesets
			mods: string[]
			passed: boolean,
			perfect: number
			pp: number | null
			rank: string
			replay: boolean
			score: number
			statistics: {
				count_100: number
				count_300: number
				count_50: number
				count_geki: number
				count_katu: number
				count_miss: number
			}
			type: string
			user_id: number
			current_user_attributes: {[k: string]: any}
			match: {
				slot: number
				team: string
				pass: boolean
			}
		}[]
	}
	users: UserWithCountry[]
	first_event_id: number
	latest_event_id: number
	current_game_id: number | null
}
