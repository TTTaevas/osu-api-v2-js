import { Beatmap, Beatmapset } from "./beatmap.js"
import { Rulesets } from "./misc.js"

export interface Score {
	id: number
	best_id: number
	user_id: number
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
