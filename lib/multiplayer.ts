import { BeatmapWithBeatmapset, BeatmapWithBeatmapsetChecksumMaxcombo } from "./beatmap.js"
import { Rulesets, Mod } from "./misc.js"
import { ScoreWithMatch } from "./score.js"
import { User, UserWithCountry, UserWithCountryCover } from "./user.js"

/**
 * Expected from api.getRoom()
 */
export interface Room {
	active: boolean
	auto_skip: boolean
	category: string
	channel_id: number
	ends_at: Date | null
	has_password: boolean
	host: UserWithCountry
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
	/**
	 * Only exists if authorized user
	 */
	current_user_score?: {
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
		/**
		 * How many (completed?) attempts on each item? Empty array if the multiplayer room is the realtime kind
		 */
		playlist_item_attempts: {
			attempts: number
			id: number
		}[]
	}
}

/**
 * Expected from Room
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
	beatmap: BeatmapWithBeatmapsetChecksumMaxcombo
}

/**
 * Expected from MultiplayerScores
 * @remarks This particular interface seems really unstable, beware
 */
export interface MultiplayerScore {
	/**
	 * In a format where `96.40%` would be `0.9640` (and no number afterwards)
	 */
	accuracy: number
	beatmap_id: number
	ended_at: Date
	max_combo: number
	max_statistics: {
		great: number
		ignore_hit: number
		large_tick_hit: number
		small_tick_hit: number
	}
	mods: Mod[]
	passed: boolean
	rank: string
	ruleset_id: number
	started_at: Date
	statistics: {
		great: number
		large_bonus: number
		large_tick_hit: number
		meh: number
		miss: number
		ok: number
		small_bonus: number
		small_tick_hit: number
		small_tick_miss: number
	}
	total_score: number
	user_id: number
	playlist_item_id: number
	room_id: number
	id: number
	pp: number | null
	replay: boolean
	type: string
	user: UserWithCountryCover
}

/**
 * Expected from api.getPlaylistItemScores()
 */
export interface MultiplayerScores {
	params: {
		limit: number
		sort: string
	}
	/**
	 * How many scores there are across all pages, not necessarily `scores.length`
	 */
	total: number
	scores: MultiplayerScore[]
	/**
	 * Will be null if not an authorized user or if the authorized user has no score
	 */
	user_score: MultiplayerScore | null
	/**
	 * Will be null if there is no next page
	 */
	cursor_string: string | null
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

/**
 * Expected from api.getMatches(), Match
 */
export interface MatchInfo {
	id: number
	start_time: Date
	end_time: Date | null
	name: string
}

/**
 * Expected from api.getMatch()
 */
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
			mode: string
			mode_int: Rulesets
			scoring_type: string
			team_type: string
			mods: string[]
			beatmap: BeatmapWithBeatmapset
			scores: ScoreWithMatch[]
		}
	}[]
	users: UserWithCountry[]
	first_event_id: number
	latest_event_id: number
	current_game_id: number | null
}
