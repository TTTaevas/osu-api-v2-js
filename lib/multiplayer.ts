import { BeatmapCompact } from "./beatmap"
import { User, UserCompact } from "./user"

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
	ends_at: Date
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
	allowed_mods: {
		acronym: string
		settings?: {[k: string]: any}
	}[]
	required_mods: {
		acronym: string
		settings?: {[k: string]: any}
	}[]
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
	mods: {
		acronym: string
		settings?: {[k: string]: any}
	}[]
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
