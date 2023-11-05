import { BeatmapCompact } from "./beatmap.js"
import { GameModes, Mod } from "./misc.js"
import { User, UserCompact } from "./user.js"

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
	active: Boolean
	has_password: Boolean
	queue_mode: string
	auto_skip: Boolean
	current_user_score: {[k: string]: any}
	host: UserCompact
	playlist: PlaylistItem[]
	recent_participants: UserCompact[]
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
	expired: Boolean
	owner_id: number
	playlist_order: number
	played_at: Date
	beatmap: BeatmapCompact
}

export interface MultiplayerScore {
	id: number
	user_id: number
	room_id: number
	playlist_item_id: number
	beatmap_id: number
	rank: string
	total_score: number
	accuracy: number
	max_combo: number
	mods: Mod[]
	statistics: any
	passed: Boolean
	started_at?: Date
	ended_at?: Date
	position?: number | null
	scores_around: {
		higher: MultiplayerScores
		lower: MultiplayerScores
	}
	user: User
}

export interface MultiplayerScores {
	cursor_string: any
	params: {[k: string]: any}
	scores: MultiplayerScore[]
	total: number | null
	user_score: MultiplayerScore | null
}

export interface Leader {
	accuracy: number
	attempts: number
	completed: number
	pp: number
	room_id: number
	total_score: number
	user_id: number
	user: UserCompact
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
			mode_int: GameModes
			scoring_type: string
			team_type: string
			mods: string[]
			beatmap: BeatmapCompact
		}
		scores?: {
			accuracy: number
			best_id: number | null
			created_at: Date
			id: number | null
			max_combo: number
			mode: string
			mode_int: GameModes
			mods: string[]
			passed: Boolean,
			perfect: number
			pp: number | null
			rank: string
			replay: Boolean
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
				pass: Boolean
			}
		}[]
	}
	users: UserCompact[]
	first_event_id: number
	latest_event_id: number
	current_game_id: number | null
}
