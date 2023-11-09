import { Beatmap, Beatmapset } from "./beatmap.js"
import { Rulesets } from "./misc.js"

export interface Score {
	id: number
	best_id: number
	/**
	 * The ID of the user who made the score
	 */
	user_id: number
	/**
	 * In a format where `96.40%` would be `0.9640` (likely with some numbers after the zero)
	 */
	accuracy: number
	/**
	 * 0 when NoMod
	 */
	mods: 0 | string[]
	score: number
	max_combo: number
	perfect: boolean
	statistics: {
		count_50: number
		count_100: number
		count_300: number
		count_geki: number
		count_katu: number
		count_miss: number
	}
	passed: boolean
	/**
	 * null when Beatmap is Loved (for example)
	 */
	pp: null | number
	rank: string
	created_at: Date
	mode: string
	mode_int: Rulesets
	replay: boolean
	beatmap?: Beatmap
	beatmapset?: Beatmapset
	rank_country?: any
	rank_global?: any
	/**
	 * @remarks Should only exist from the returned object of `getUserScores` if `type` is set to `best`
	 */
	weight?: any
	user?: any
	match?: any
	/**
	 * @remarks Not in the API's documentation, expect it to either be unreliable or disappear 
	 */
	current_user_attributes?: {
		/**
		 * @remarks Seems to remain null even if the score is pinned on the user's profile
		 */
		pin: null
	}
}

export interface BeatmapUserScore {
	/**
	 * Value depends on the requested mode and mods!
	 */
	position: number
	score: Score
}

export interface BeatmapScores {
	scores: Score[]
	userScore: BeatmapUserScore | null
	user_score: BeatmapUserScore | null | undefined
}
